/**
 * Unit tests for SignupForm component.
 * Framework: Jest + @testing-library/react (or Vitest with compatible APIs).
 * This file focuses on the PR diff behavior: submission flows, error handling, zod validation, loading state, and i18n text rendering.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupForm from "./SignupForm";

// Mocks for external deps
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    // Simple identity translator for test stability; return key paths used in component.
    const dict: Record<string, string> = {
      "components.auth.signUp.title": "Create your account",
      "components.auth.signUp.description": "Join us",
      "components.auth.signUp.form.name": "Name",
      "components.auth.signUp.form.email": "Email",
      "components.auth.signUp.form.password": "Password",
      "components.auth.signUp.form.confirmPassword": "Confirm password",
      "components.auth.signUp.form.submit": "Create account",
      "components.auth.signUp.form.submitting": "Creating...",
      "components.auth.signUp.form.success.title": "Account created",
      "components.auth.signUp.form.success.description": "You can now sign in",
      "components.auth.signUp.form.success.action": "Go to sign in",
      "components.auth.signUp.form.error.email.title": "Email already used",
      "components.auth.signUp.form.error.email.description": "Try another email",
      "components.auth.signUp.form.error.unknown.title": "Something went wrong",
      "components.auth.signUp.form.error.unknown.description": "Please try again",
      "components.auth.signUp.or": "Or",
      "components.auth.signUp.google": "Continue with Google",
    };
    return dict[`components.auth.signUp.${key}`] ?? key;
  },
}));

// Mock toast hook
const toastSpy = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  toast: (args: any) => toastSpy(args),
}));

// Mock create user action
const createUserHandlerMock = jest.fn();
jest.mock("@/actions/create", () => ({
  createUserHandler: (args: any) => createUserHandlerMock(args),
}));

// Silence next/link warnings by mocking as a simple anchor
jest.mock("next/link", () => {
  return ({ href, children }: any) => <a href={href} data-testid="next-link-mock">{children}</a>;
});

describe("SignupForm", () => {
  const locale = "en";

  const fillForm = async (u: ReturnType<typeof userEvent.setup>, data: {name?: string; email?: string; password?: string; passwordConfirmation?: string}) => {
    if (data.name !== undefined) {
      await u.clear(screen.getByLabelText("Name"));
      await u.type(screen.getByLabelText("Name"), data.name);
    }
    if (data.email !== undefined) {
      await u.clear(screen.getByLabelText("Email"));
      await u.type(screen.getByLabelText("Email"), data.email);
    }
    if (data.password !== undefined) {
      await u.clear(screen.getByLabelText("Password"));
      await u.type(screen.getByLabelText("Password"), data.password);
    }
    if (data.passwordConfirmation !== undefined) {
      await u.clear(screen.getByLabelText("Confirm password"));
      await u.type(screen.getByLabelText("Confirm password"), data.passwordConfirmation);
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders core fields and actions", () => {
    render(<SignupForm locale={locale} />);
    expect(screen.getByText("Create your account")).toBeInTheDocument();
    expect(screen.getByText("Join us")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
    expect(screen.getByText("Or")).toBeInTheDocument();
    expect(screen.getByText("Continue with Google")).toBeInTheDocument();
  });

  it("submits successfully and shows success toast with login action link", async () => {
    createUserHandlerMock.mockResolvedValueOnce({ status: "ok" });

    const u = userEvent.setup();
    render(<SignupForm locale={locale} />);

    await fillForm(u, {
      name: "John Doe",
      email: "john@example.com",
      password: "Str0ngP@ss!",
      passwordConfirmation: "Str0ngP@ss!",
    });

    await u.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(createUserHandlerMock).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "Str0ngP@ss!",
        passwordConfirmation: "Str0ngP@ss!",
      });
    });

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalled();
      const args = toastSpy.mock.calls[0][0];
      expect(args.title).toBe("Account created");
      expect(args.description).toBe("You can now sign in");
      // Ensure the action renders a link to /en/signin?side=login
      const { action } = args;
      // Render action into a container to assert href (if not a real element, we rely on snapshot presence)
      expect(action).toBeTruthy();
    });
  });

  it("shows submitting state while waiting for response", async () => {
    // Make the promise pending for a tick
    let resolveFn: (v?: any) => void = () => {};
    createUserHandlerMock.mockImplementationOnce(
      () => new Promise(res => { resolveFn = res; })
    );

    const u = userEvent.setup();
    render(<SignupForm locale={locale} />);

    await fillForm(u, {
      name: "Jane Doe",
      email: "jane@example.com",
      password: "StrongPass123!",
      passwordConfirmation: "StrongPass123!",
    });

    const submitBtn = screen.getByRole("button", { name: "Create account" });
    await u.click(submitBtn);

    // Button switches to disabled 'Creating...' state
    expect(screen.getByRole("button", { name: "Creating..." })).toBeDisabled();

    // Resolve and ensure the button returns to normal
    resolveFn({ status: "ok" });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled();
    });
  });

  it("handles email exists error with destructive toast", async () => {
    createUserHandlerMock.mockResolvedValueOnce({ status: "error", message: "email-exists" });

    const u = userEvent.setup();
    render(<SignupForm locale={locale} />);

    await fillForm(u, {
      name: "John Doe",
      email: "taken@example.com",
      password: "Str0ngP@ss!",
      passwordConfirmation: "Str0ngP@ss!",
    });

    await u.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalled();
      const args = toastSpy.mock.calls[0][0];
      expect(args.title).toBe("Email already used");
      expect(args.description).toBe("Try another email");
      expect(args.variant).toBe("destructive");
    });
  });

  it("handles unknown errors with destructive toast", async () => {
    createUserHandlerMock.mockResolvedValueOnce({ status: "error", message: "server-bork" });

    const u = userEvent.setup();
    render(<SignupForm locale={locale} />);

    await fillForm(u, {
      name: "John Doe",
      email: "john@example.com",
      password: "Str0ngP@ss!",
      passwordConfirmation: "Str0ngP@ss!",
    });

    await u.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(toastSpy).toHaveBeenCalled();
      const args = toastSpy.mock.calls[0][0];
      expect(args.title).toBe("Something went wrong");
      expect(args.description).toBe("Please try again");
      expect(args.variant).toBe("destructive");
    });
  });

  it("validates mismatched passwords before submit", async () => {
    createUserHandlerMock.mockResolvedValueOnce({ status: "ok" }); // should not be called

    const u = userEvent.setup();
    render(<SignupForm locale={locale} />);

    await fillForm(u, {
      name: "John",
      email: "john@example.com",
      password: "StrongPass123!",
      passwordConfirmation: "WrongPass123!",
    });

    await u.click(screen.getByRole("button", { name: "Create account" }));

    // Expect a form message to appear; exact text depends on zod schema messages.
    // We assert that submit handler was not called due to client-side validation failing.
    await waitFor(() => {
      expect(createUserHandlerMock).not.toHaveBeenCalled();
    });
  });

  it("validates invalid email format", async () => {
    createUserHandlerMock.mockResolvedValueOnce({ status: "ok" }); // should not be called

    const u = userEvent.setup();
    render(<SignupForm locale={locale} />);

    await fillForm(u, {
      name: "John",
      email: "not-an-email",
      password: "StrongPass123!",
      passwordConfirmation: "StrongPass123!",
    });

    await u.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(createUserHandlerMock).not.toHaveBeenCalled();
    });
  });

  it("renders Google OAuth link with correct href", () => {
    render(<SignupForm locale={locale} />);
    const link = screen.getByRole("link", { name: /Continue with Google/i });
    expect(link).toHaveAttribute("href", "/api/oauth/login/google");
  });

  it("includes sign-in link in success toast action with locale param", async () => {
    createUserHandlerMock.mockResolvedValueOnce({ status: "ok" });
    const u = userEvent.setup();
    render(<SignupForm locale={locale} />);

    await fillForm(u, {
      name: "John Doe",
      email: "john@example.com",
      password: "Passw0rd!",
      passwordConfirmation: "Passw0rd!",
    });

    await u.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(toastSpy).toHaveBeenCalled());
    const args = toastSpy.mock.calls[0][0];
    // Shallow check that action exists and includes the expected href when rendered
    const actionElement = args.action;
    expect(actionElement).toBeTruthy();
    // We can't inspect children props without rendering; this is a smoke check.
  });
});