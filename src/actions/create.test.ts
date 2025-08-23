/* 
  Tests for createUserHandler
  Testing library/framework: Vitest (detected automatically by script).
*/
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as bcrypt from "bcryptjs";

vi.mock("@/lib/definitions", () => {
  const safeParse = vi.fn(() => ({ success: true }));
  return { SignupFormSchema: { safeParse } };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      create: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  genSaltSync: vi.fn(() => "salt"),
  hashSync: vi.fn(() => "hashed-password"),
}));

vi.mock("date-fns", async () => {
  const actual = await vi.importActual<any>("date-fns");
  return {
    ...actual,
    // Use a deterministic addDays to make assertions on exact timestamps
    addDays: vi.fn((date: Date, days: number) => new Date(date.getTime() + days * 86400000)),
  };
});

vi.mock("@prisma/client", () => {
  class PrismaClientKnownRequestError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
      Object.setPrototypeOf(this, PrismaClientKnownRequestError.prototype);
      this.name = "PrismaClientKnownRequestError";
    }
  }
  return { Prisma: { PrismaClientKnownRequestError } };
});

// Imports after mocks
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import { createUserHandler } from "@/actions/create";

const mockedCreate = prisma.user.create as unknown as ReturnType<typeof vi.fn>;
const mockedAddDays = addDays as unknown as ReturnType<typeof vi.fn>;

describe("createUserHandler (Vitest)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    (globalThis as any).crypto = (globalThis as any).crypto || {};
    (globalThis as any).crypto.randomUUID = vi.fn(() => "test-uuid");
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a user successfully and returns ok", async () => {
    (mockedCreate as any).mockResolvedValueOnce({ id: "u1" });

    const result = await createUserHandler({
      name: "Alice",
      email: "alice@example.com",
      password: "P@ssw0rd!",
      passwordConfirmation: "P@ssw0rd!",
    } as any);

    expect(result).toEqual({ status: "ok" });

    // bcrypt usage
    expect((bcrypt.genSaltSync as any)).toHaveBeenCalledWith(10);
    expect((bcrypt.hashSync as any)).toHaveBeenCalledWith("P@ssw0rd!", "salt");

    // Prisma payload shape
    expect(mockedCreate).toHaveBeenCalledTimes(1);
    const payload = (mockedCreate as any).mock.calls[0][0];
    expect(payload.data.name).toBe("Alice");
    expect(payload.data.email).toBe("alice@example.com");
    expect(payload.data.password).toBe("hashed-password");
    expect(payload.data.emailVerificationDeadline.toISOString()).toBe("2025-01-08T00:00:00.000Z");
    expect(payload.data.verifiedEmailRequest.create.token).toBe("test-uuid");
    expect(payload.data.verifiedEmailRequest.create.expires.toISOString()).toBe("2025-01-08T00:00:00.000Z");

    // addDays should be called twice with +7 days
    expect(mockedAddDays).toHaveBeenCalledTimes(2);
    expect((mockedAddDays as any).mock.calls.every(([, days]: [Date, number]) => days === 7)).toBe(true);

    // zod validation invoked with provided values
    const defs = await import("@/lib/definitions");
    expect((defs as any).SignupFormSchema.safeParse).toHaveBeenCalledWith({
      email: "alice@example.com",
      password: "P@ssw0rd!",
      passwordConfirmation: "P@ssw0rd!",
    });
    expect((globalThis as any).crypto.randomUUID).toHaveBeenCalledTimes(1);
  });

  it("returns error when passwords do not match", async () => {
    const result = await createUserHandler({
      name: "Bob",
      email: "bob@example.com",
      password: "abc",
      passwordConfirmation: "xyz",
    } as any);

    expect(result).toEqual({ status: "error", message: "Passwords don't match" });
    expect(mockedCreate).not.toHaveBeenCalled();
    expect((bcrypt.hashSync as any)).not.toHaveBeenCalled();
  });

  it("maps Prisma P2002 duplicate email error to email-exists", async () => {
    const { Prisma } = await import("@prisma/client");
    const dupErr = new (Prisma as any).PrismaClientKnownRequestError("Unique constraint", "P2002");
    (mockedCreate as any).mockRejectedValueOnce(dupErr);

    const result = await createUserHandler({
      name: "Eve",
      email: "eve@example.com",
      password: "abc12345",
      passwordConfirmation: "abc12345",
    } as any);

    expect(result).toEqual({ status: "error", message: "email-exists" });
  });

  it("returns a generic error on unknown failures", async () => {
    (mockedCreate as any).mockRejectedValueOnce(new Error("db down"));

    const result = await createUserHandler({
      name: "Zoe",
      email: "zoe@example.com",
      password: "abc12345",
      passwordConfirmation: "abc12345",
    } as any);

    expect(result).toEqual({
      status: "error",
      message: "An unknown error happened while creating your account",
    });
  });

  it("returns validation error if SignupFormSchema.safeParse throws", async () => {
    const defs = await import("@/lib/definitions");
    (defs as any).SignupFormSchema.safeParse.mockImplementationOnce(() => {
      throw new Error("Invalid email");
    });

    const result = await createUserHandler({
      name: "Max",
      email: "bad-email",
      password: "pass",
      passwordConfirmation: "pass",
    } as any);

    expect(result).toEqual({ status: "error", message: "Invalid email" });
    expect(mockedCreate).not.toHaveBeenCalled();
  });
});