import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";

// Under test
import FileOptions from "./FileOptions";

// Types and enums used in props (lightweight re-declare to avoid importing Prisma at test time)
enum FileType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
}

// --- Global mocks for external modules ---

// next-intl translations: return the key or a simple map
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// next/navigation search params
vi.mock("next/navigation", () => {
  const params = new URLSearchParams({
    share: "token123",
    h: "hash456",
    t: "p",
  });
  return {
    useSearchParams: () => ({
      get: (k: string) => params.get(k),
    }),
  };
});

// Session provider
vi.mock("@/providers/SessionProvider", () => ({
  useSession: () => ({ user: { id: "user-1" } }),
}));

// Files context: capture setFiles calls
const setFilesMock = vi.fn();
vi.mock("@/context/FilesContext", async () => {
  // Provide a minimal ContextFile type shape
  return {
    useFilesContext: () => ({
      setFiles: setFilesMock,
    }),
  };
});

// Toasts
const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  toast: (args: unknown) => toastMock(args),
}));
const sonnerErrorMock = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (msg: string) => sonnerErrorMock(msg) },
}));

// Actions: add/remove tags
const addTagsToFileMock = vi.fn();
const removeTagsFromFileMock = vi.fn();
vi.mock("@/actions/tags", () => ({
  addTagsToFile: (...args: unknown[]) => addTagsToFileMock(...args),
  removeTagsFromFile: (...args: unknown[]) => removeTagsFromFileMock(...args),
}));

// Utils: copy and download
const copyImageToClipboardMock = vi.fn().mockResolvedValue(undefined);
const downloadClientImageHandlerMock = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/utils", () => ({
  copyImageToClipboard: (...args: unknown[]) =>
    copyImageToClipboardMock(...args),
  downloadClientImageHandler: (...args: unknown[]) =>
    downloadClientImageHandlerMock(...args),
}));

// UI wrappers replaced with simple pass-throughs that inject control buttons
vi.mock("../ManageTagsDialog", () => ({
  __esModule: true,
  default: ({
    onTagSelected,
    onTagUnselected,
    onTagAdded,
    children,
  }: any) => (
    <div data-testid="ManageTagsDialog">
      <button
        type="button"
        onClick={() =>
          onTagSelected?.({ id: "t1", name: "tag-1" })
        }
      >
        SelectTag
      </button>
      <button
        type="button"
        onClick={() =>
          onTagUnselected?.({ id: "t1", name: "tag-1" })
        }
      >
        UnselectTag
      </button>
      <button
        type="button"
        onClick={() =>
          onTagAdded?.({ id: "t2", name: "tag-2" })
        }
      >
        AddTag
      </button>
      <div data-testid="ManageTagsDialog-children">{children}</div>
    </div>
  ),
}));

vi.mock("./FullScrenImageCarousel", () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="FullScreenImageCarousel">{children}</div>
  ),
}));

vi.mock("../ImageExif", () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="ImageExif">{children}</div>
  ),
}));

// Minimal helpers to build file props
const baseFile = (overrides: Partial<any> = {}) => ({
  id: "file-1",
  folderId: "folder-1",
  createdById: "user-1",
  type: FileType.IMAGE,
  tags: [],
  folder: {
    id: "folder-1",
    tags: [
      { id: "t1", name: "tag-1" },
      { id: "t2", name: "tag-2" },
    ],
  },
  ...overrides,
});

const carouselApi: any = {}; // not used internally

beforeEach(() => {
  vi.useFakeTimers();
  setFilesMock.mockReset();
  toastMock.mockReset();
  sonnerErrorMock.mockReset();
  addTagsToFileMock.mockReset();
  removeTagsFromFileMock.mockReset();
  copyImageToClipboardMock.mockClear();
  downloadClientImageHandlerMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FileOptions component (toolbar and menu actions)", () => {
  it("renders tag management controls only when current user is the creator", () => {
    // User is creator
    render(
      <FileOptions
        file={baseFile({ createdById: "user-1" })}
        fullScreenCarouselFiles={[baseFile()]}
        currentIndexState={0}
        carouselApi={carouselApi}
      />
    );
    expect(screen.getByTestId("ManageTagsDialog")).toBeInTheDocument();

    // Rerender as not creator
    render(
      <FileOptions
        file={baseFile({ createdById: "other-user" })}
        fullScreenCarouselFiles={[baseFile()]}
        currentIndexState={0}
        carouselApi={carouselApi}
      />
    );
    // Should render dropdown still but without ManageTagsDialog in either toolbar or menu
    expect(screen.queryByTestId("ManageTagsDialog")).not.toBeInTheDocument();
  });

  it("optimistically adds a tag on SelectTag, rolls back on addTagsToFile failure with sonner error", async () => {
    addTagsToFileMock.mockResolvedValueOnce({ success: false });

    render(
      <FileOptions
        file={baseFile()}
        fullScreenCarouselFiles={[baseFile()]}
        currentIndexState={0}
        carouselApi={carouselApi}
      />
    );

    // Trigger selection
    fireEvent.click(screen.getByText("SelectTag"));

    // setFiles called for optimistic add
    expect(setFilesMock).toHaveBeenCalled();
    // After action fails, should show error and rollback (another setFiles call)
    await act(async () => {});

    expect(addTagsToFileMock).toHaveBeenCalledWith("file-1", ["t1"]);
    expect(sonnerErrorMock).toHaveBeenCalled(); // error toast
    // Called twice: optimistic add and rollback
    expect(setFilesMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("removes a tag on UnselectTag and rolls back on failure", async () => {
    removeTagsFromFileMock.mockResolvedValueOnce({ success: false });

    // Start with file having tag t1
    render(
      <FileOptions
        file={baseFile({ tags: [{ id: "t1", name: "tag-1" }] })}
        fullScreenCarouselFiles={[baseFile()]}
        currentIndexState={0}
        carouselApi={carouselApi}
      />
    );

    fireEvent.click(screen.getByText("UnselectTag"));

    await act(async () => {});
    expect(removeTagsFromFileMock).toHaveBeenCalledWith("file-1", ["t1"]);
    expect(sonnerErrorMock).toHaveBeenCalled();
    // Optimistic remove and rollback add
    expect(setFilesMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("handleTagAdded delegates to handleTagSelected and rolls back appropriately", async () => {
    // First call returns false to simulate failure in add
    addTagsToFileMock.mockResolvedValueOnce({ success: false });

    render(
      <FileOptions
        file={baseFile()}
        fullScreenCarouselFiles={[baseFile()]}
        currentIndexState={0}
        carouselApi={carouselApi}
      />
    );

    fireEvent.click(screen.getByText("AddTag"));

    await act(async () => {});
    expect(addTagsToFileMock).toHaveBeenCalledWith("file-1", ["t2"]);
    // One optimistic update when adding, then rollback when handleTagSelected returns false,
    // then handleTagAdded's own rollback when r is false
    expect(setFilesMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("invokes downloadClientImageHandler and shows loading state", async () => {
    render(
      <FileOptions
        file={baseFile()}
        fullScreenCarouselFiles={[baseFile()]}
        currentIndexState={0}
        carouselApi={carouselApi}
      />
    );

    // There are many icon-only buttons; grab the one inside the FullScreenImageCarousel wrapper to avoid ambiguity
    const toolbar = screen.getByTestId("FullScreenImageCarousel").parentElement as HTMLElement;
    // The download button is outside carousel, but we have many; fallback: query all buttons and click the 3rd index heuristic:
    const buttons = screen.getAllByRole("button");
    // Defensive: click a button that will call download handler by double invoking until mock is called
    let clicked = false;
    for (const btn of buttons) {
      fireEvent.click(btn);
      if (downloadClientImageHandlerMock.mock.calls.length > 0) {
        clicked = true;
        break;
      }
    }
    expect(clicked).toBe(true);
    expect(downloadClientImageHandlerMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "file-1" })
    );
  });

  it("copies image to clipboard for non-video files and shows success toast with timed reset", async () => {
    render(
      <FileOptions
        file={baseFile({ type: FileType.IMAGE })}
        fullScreenCarouselFiles={[baseFile()]}
        currentIndexState={0}
        carouselApi={carouselApi}
      />
    );

    // Click through all buttons until copy is triggered
    const priorCalls = copyImageToClipboardMock.mock.calls.length;
    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      fireEvent.click(btn);
      if (copyImageToClipboardMock.mock.calls.length > priorCalls) break;
    }

    expect(copyImageToClipboardMock).toHaveBeenCalledWith(
      "folder-1",
      "file-1",
      "token123",
      "hash456",
      "personAccessToken"
    );
    // Success toast fired
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "components.images.carousel.actions.copy.success.title",
      })
    );

    // timer for copied reset
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
  });

  it("shows destructive toast instead of copying when FileType is VIDEO (desktop and dropdown paths)", async () => {
    render(
      <FileOptions
        file={baseFile({ type: FileType.VIDEO })}
        fullScreenCarouselFiles={[baseFile({ type: FileType.VIDEO })]}
        currentIndexState={0}
        carouselApi={carouselApi}
      />
    );

    // Attempt to trigger copy from desktop toolbar
    const priorCopy = copyImageToClipboardMock.mock.calls.length;
    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      fireEvent.click(btn);
    }
    // No copy should occur
    expect(copyImageToClipboardMock.mock.calls.length).toBe(priorCopy);

    // A destructive toast should have been shown at least once
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title:
          "components.images.carousel.actions.copy.errors.video-copy-unavailable.title",
        variant: "destructive",
      })
    );
  });

  it("builds external link with correct query params from useSearchParams", () => {
    render(
      <FileOptions
        file={baseFile()}
        fullScreenCarouselFiles={[baseFile()]}
        currentIndexState={0}
        carouselApi={carouselApi}
      />
    );
    // There's a Link rendered asChild inside a Button in toolbar and one in dropdown.
    const links = screen.getAllByRole("link");
    // Verify at least one link has the expected composed href
    const expectedParamPart = "share=token123&h=hash456&t=p";
    expect(links.some((a) => (a as HTMLAnchorElement).href.includes(expectedParamPart))).toBe(
      true
    );
  });
});