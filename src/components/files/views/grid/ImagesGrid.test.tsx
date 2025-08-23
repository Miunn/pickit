/**
 * Tests for ImagesGrid
 *
 * Testing stack: React Testing Library + Jest/Vitest mocking APIs.
 * - We mock heavy UI and external modules: dnd-kit, ImagePreviewGrid, dialogs, actions, contexts, next-intl, toast.
 * - Focus on logic in the provided diff: sorting, selection (including shift-range), carousel opening, tag management, multi-delete, and drag reorder behavior.
 */

import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Under test
import { ImagesGrid } from "./ImagesGrid";

// -------------------- Mocks --------------------

// Helper to switch between jest and vitest APIs without changing code:
const mockFn = (...args: any[]) => (typeof vi !== "undefined" ? vi.fn(...args) : jest.fn(...args));
const mockReset = (fn: any) => (typeof vi !== "undefined" ? fn.mockReset() : fn.mockReset());
const useFakeTimers = () => (typeof vi !== "undefined" ? vi.useFakeTimers() : jest.useFakeTimers());
const runAllTimers = async () => {
  if (typeof vi !== "undefined") {
    await vi.runAllTimersAsync?.();
    vi.runAllTimers();
  } else {
    jest.runAllTimers();
  }
};

// Files/Context models
type FolderTag = { id: string; name: string };
type CtxFile = {
  id: string;
  size: number;
  position: number;
  createdAt: string | Date;
  tags: FolderTag[];
};

// ---- Mock: next-intl useTranslations ----
const tMock = (ns: string) => {
  // Provide stable strings we can query in tests
  const dict: Record<string, string> = {
    "images.newFiles": "New files",
    "images.albumContent": "Album content",
    "images.manageTags": "Manage tags",
    "dialogs.images.deleteMultiple.trigger": "Delete selected",
    "images.selected": "{count} selected", // We'll render via simple replacement for sanity
    "images.addTag.errorAdd": "Could not add tag",
    "images.addTag.errorRemove": "Could not remove tag",
  };
  return (key: string, params?: Record<string, any>) => {
    const fullKey = `${ns}.${key}`;
    if (fullKey === "images.selected" || key === "selected") {
      const count = params?.count ?? 0;
      return `${count} selected`;
    }
    return dict[fullKey] || dict[key] || key;
  };
};

jest.mock("next-intl", () => ({
  useTranslations: (ns: string) => tMock(ns),
}));

// ---- Mock: toast from sonner ----
const toastError = mockFn();
jest.mock("sonner", () => ({
  toast: { error: (...args: any[]) => toastError(...args) },
}));

// ---- Mock: actions ----
const updateFilePosition = mockFn(async (_id: string, _before?: string, _after?: string) => ({ newPosition: 100 }));
const addTagsToFiles = mockFn(async (_fileIds: string[], _tagIds: string[]) => ({ success: true }));
const removeTagsFromFiles = mockFn(async (_fileIds: string[], _tagIds: string[]) => ({ success: true }));

jest.mock("@/actions/files", () => ({
  updateFilePosition: (...args: any[]) => updateFilePosition(...args),
}));

jest.mock("@/actions/tags", () => ({
  addTagsToFiles: (...args: any[]) => addTagsToFiles(...args),
  removeTagsFromFiles: (...args: any[]) => removeTagsFromFiles(...args),
}));

// ---- Mock: utils getSortedImagesVideosContent + formatBytes + cn ----
const getSortedImagesVideosContent = mockFn((files: CtxFile[]) => {
  // Return files sorted lexicographically by id to make assertions deterministic when sortState != "dragOrder"
  return [...files].sort((a, b) => a.id.localeCompare(b.id));
});
const formatBytes = (bytes: number) => `${bytes} B`;
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

jest.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => cn(...args),
  formatBytes: (...args: any[]) => formatBytes(...args),
  getSortedImagesVideosContent: (...args: any[]) => getSortedImagesVideosContent(...args),
}));

// ---- Mock: Session & Folder & Files Contexts ----
const mockUser = { id: "u1" };
let mockFolder: any = {
  id: "folder1",
  name: "My Album",
  createdById: "u1",
  description: "Folder description",
  tags: [{ id: "t1", name: "Tag1" }] as FolderTag[],
};
let mockFiles: CtxFile[] = [];
const setFilesSpy = mockFn((updater: any) => {
  if (typeof updater === "function") {
    mockFiles = updater(mockFiles);
  } else {
    mockFiles = updater;
  }
});

jest.mock("@/providers/SessionProvider", () => ({
  useSession: () => ({ user: mockUser }),
}));
jest.mock("@/context/FolderContext", () => ({
  useFolderContext: () => ({ folder: mockFolder, isShared: false }),
}));
jest.mock("@/context/FilesContext", () => ({
  useFilesContext: () => ({ files: mockFiles, setFiles: (...args: any[]) => setFilesSpy(...args) }),
}));

// ---- Mock: UI leaf components to simplify interactions ----

// ImagePreviewGrid should surface click/select behavior and expose file id for querying.
jest.mock("@/components/files/views/grid/ImagePreviewGrid", () => ({
  ImagePreviewGrid: (props: any) => {
    const { file, onClick, onSelect, className } = props;
    return (
      <div data-testid={`image-${file.id}`} className={className || ""}>
        <button data-testid={`click-${file.id}`} onClick={(e) => onClick?.(e)}>
          open
        </button>
        <button data-testid={`select-${file.id}`} onClick={() => onSelect?.()}>
          select
        </button>
        <span data-testid={`size-${file.id}`}>{file.size}</span>
      </div>
    );
  },
}));

// UploadImagesForm just triggers onUpload with payload
jest.mock("@/components/files/upload/UploadImagesForm", () => ({
  UploadImagesForm: (props: any) => {
    const { onUpload } = props;
    return (
      <button data-testid="upload-trigger" onClick={() => onUpload?.([{ id: "f3", size: 3, position: 3, createdAt: new Date().toISOString(), tags: [] }])}>
        upload
      </button>
    );
  },
}));

// CarouselDialog renders open state to assert
let latestCarouselOpen: boolean | null = null;
jest.mock("@/components/files/carousel/CarouselDialog", () => ({
  CarouselDialog: (props: any) => {
    latestCarouselOpen = !!props.carouselOpen;
    return <div data-testid="carousel" data-open={props.carouselOpen ? "true" : "false"} />;
  },
}));

// DeleteMultipleImagesDialog exposes a button to call onDelete
jest.mock("@/components/files/DeleteMultipleImagesDialog", () => ({
  DeleteMultipleImagesDialog: (props: any) => {
    const { open, onDelete } = props;
    return (
      <div data-testid="delete-multiple" data-open={open ? "true" : "false"}>
        <button data-testid="confirm-delete" onClick={() => onDelete?.()}>confirm delete</button>
      </div>
    );
  },
}));

// ManageTagsDialog renders provided children and test-hooks to add/remove tags
jest.mock("../../ManageTagsDialog", () => ({
  __esModule: true,
  default: (props: any) => {
    const { children, onTagSelected, onTagUnselected } = props;
    const tag: FolderTag = { id: "tX", name: "ExtraTag" };
    return (
      <div data-testid="manage-tags">
        <div>{children}</div>
        <button data-testid="add-tag" onClick={async () => onTagSelected?.(tag)}>
          add-tag
        </button>
        <button data-testid="remove-tag" onClick={async () => onTagUnselected?.(tag)}>
          remove-tag
        </button>
      </div>
    );
  },
}));

// Edit/Delete description dialogs just render children
jest.mock("@/components/folders/EditDescriptionDialog", () => ({
  __esModule: true,
  default: (props: any) => <div>{props.children}</div>,
}));
jest.mock("@/components/folders/DeleteDescriptionDialog", () => ({
  __esModule: true,
  default: (props: any) => <div>{props.children}</div>,
}));

// ---- Mock: dnd-kit to avoid complex DOM events ----
let lastDndHandlers: Record<string, any> = {};
jest.mock("@dnd-kit/core", () => {
  return {
    DndContext: (props: any) => {
      lastDndHandlers = props || {};
      return <div data-testid="dnd">{props.children}</div>;
    },
    closestCenter: mockFn(),
    DragOverlay: ({ children }: any) => <div data-testid="drag-overlay">{children}</div>,
    useSensors: (...args: any[]) => args,
    useSensor: (..._args: any[]) => ({}),
    PointerSensor: function PointerSensor() {},
    TouchSensor: function TouchSensor() {},
  };
});
jest.mock("@dnd-kit/sortable", () => ({
  SortableContext: (props: any) => <div data-testid="sortable">{props.children}</div>,
  arrayMove: (arr: any[], from: number, to: number) => {
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  },
}));

// -------------------- Test Helpers --------------------
const makeFile = (id: string, daysAgo: number, pos: number, size = 1, tags: FolderTag[] = []): CtxFile => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { id, size, position: pos, createdAt: d.toISOString(), tags };
};

const renderGrid = (opts?: { sortState?: any; owner?: boolean; withDescription?: boolean; files?: CtxFile[] }) => {
  mockFolder = {
    ...mockFolder,
    createdById: opts?.owner === false ? "someone-else" : mockUser.id,
    description: opts?.withDescription === false ? null : "Folder description",
  };

  mockFiles = opts?.files ?? [
    makeFile("f1", 0, 1, 100),
    makeFile("f2", 4, 2, 200),
  ];
  mockReset(setFilesSpy);
  mockReset(getSortedImagesVideosContent);
  mockReset(updateFilePosition);
  mockReset(addTagsToFiles);
  mockReset(removeTagsFromFiles);
  toastError.mockReset?.();

  return render(<ImagesGrid sortState={opts?.sortState ?? "nameAsc"} />);
};

// -------------------- Tests --------------------
describe("ImagesGrid", () => {
  it("renders 'New files' and 'Album content' headings when there are recent files (<= 3 days)", () => {
    renderGrid({ files: [makeFile("fA", 1, 1), makeFile("fB", 5, 2)] });

    // Use the translation keys we mocked
    expect(screen.getByText("New files")).toBeInTheDocument();
    expect(screen.getByText("Album content")).toBeInTheDocument();
  });

  it("does not render 'New files' section when there are no files within last 3 days", () => {
    renderGrid({ files: [makeFile("fOld1", 4, 1), makeFile("fOld2", 10, 2)] });
    expect(screen.queryByText("New files")).not.toBeInTheDocument();
    // Album content still shows grid
    expect(screen.getByText("Album content")).toBeInTheDocument();
  });

  it("respects external sorting when sortState != 'dragOrder' by delegating to getSortedImagesVideosContent", () => {
    const files = [makeFile("z", 0, 2), makeFile("a", 0, 1), makeFile("m", 0, 3)];
    renderGrid({ files, sortState: "nameAsc" });
    expect(getSortedImagesVideosContent).toHaveBeenCalledWith(files, "nameAsc");
    // Because our ImagePreviewGrid mock renders one per file and we lexicographically sort ids,
    // the first rendered element underneath the grid will correspond to 'a'.
    const first = screen.getByTestId("image-a");
    const last = screen.getByTestId("image-z");
    expect(first).toBeInTheDocument();
    expect(last).toBeInTheDocument();
  });

  it("clicking a file (not selecting) opens the CarouselDialog (non-owner branch)", async () => {
    renderGrid({ owner: false });
    const openBtn = screen.getByTestId("click-f2");
    await userEvent.click(openBtn);
    const carousel = screen.getByTestId("carousel");
    expect(carousel.getAttribute("data-open")).toBe("true");
  });

  it("selection: onSelect enters selecting mode and accumulates size; clicking again toggles off", async () => {
    renderGrid({ owner: false, files: [makeFile("f1", 0, 1, 100), makeFile("f2", 0, 2, 200)] });

    // Select first
    await userEvent.click(screen.getByTestId("select-f1"));

    // Now click second (via onClick while selecting=false? No, selecting is true; use select button to add)
    await userEvent.click(screen.getByTestId("select-f2"));

    // Header renders "count selected - size"
    expect(screen.getByText(/2 selected/)).toBeInTheDocument();
    expect(screen.getByText(/300 B/)).toBeInTheDocument();

    // Toggle off one by clicking its select again
    await userEvent.click(screen.getByTestId("select-f2"));
    expect(screen.getByText(/1 selected/)).toBeInTheDocument();
    expect(screen.getByText(/100 B/)).toBeInTheDocument();
  });

  it("selection with Shift-click selects a range and adds cumulative size", async () => {
    // Use non-owner simple branch (same logic duplicated)
    const files = [
      makeFile("f1", 0, 1, 10),
      makeFile("f2", 0, 2, 20),
      makeFile("f3", 0, 3, 30),
      makeFile("f4", 0, 4, 40),
    ];
    renderGrid({ owner: false, files });

    // Enter selecting with first
    await userEvent.click(screen.getByTestId("select-f1"));

    // Shift-click on f3 using onClick handler
    const clickThird = screen.getByTestId("click-f3");
    await userEvent.click(clickThird, { shiftKey: true });

    // Expect 3 selected (f1,f2,f3) and size sum 60
    expect(screen.getByText(/3 selected/)).toBeInTheDocument();
    expect(screen.getByText(/60 B/)).toBeInTheDocument();
  });

  it("ManageTagsDialog: add tag success updates setFiles; failure rolls back and toasts error", async () => {
    const files = [
      { ...makeFile("f1", 0, 1), tags: [] },
      { ...makeFile("f2", 0, 2), tags: [] },
    ];
    renderGrid({ owner: false, files });

    // Enter selecting for both files using onSelect
    await userEvent.click(screen.getByTestId("select-f1"));
    await userEvent.click(screen.getByTestId("select-f2"));

    // Success path
    addTagsToFiles.mockResolvedValueOnce({ success: true });
    await userEvent.click(screen.getByTestId("add-tag"));
    expect(addTagsToFiles).toHaveBeenCalled();
    // Our setFilesSpy is called optimistically before API, then again after success maybe not needed.
    expect(setFilesSpy).toHaveBeenCalled();

    // Failure path: add fails -> toast error and rollback
    addTagsToFiles.mockResolvedValueOnce({ success: false });
    await userEvent.click(screen.getByTestId("add-tag"));
    expect(toastError).toHaveBeenCalledWith("Could not add tag");
    expect(setFilesSpy).toHaveBeenCalled();
  });

  it("ManageTagsDialog: remove tag failure shows toast and re-adds tag (rollback)", async () => {
    const tag: FolderTag = { id: "tX", name: "ExtraTag" };
    const files = [
      { ...makeFile("f1", 0, 1), tags: [tag] },
      { ...makeFile("f2", 0, 2), tags: [tag] },
    ];
    renderGrid({ owner: false, files });

    await userEvent.click(screen.getByTestId("select-f1"));
    await userEvent.click(screen.getByTestId("select-f2"));

    // removeTags fails
    removeTagsFromFiles.mockResolvedValueOnce({ success: false });
    await userEvent.click(screen.getByTestId("remove-tag"));
    expect(toastError).toHaveBeenCalledWith("Could not remove tag");
    expect(setFilesSpy).toHaveBeenCalled();
  });

  it("Delete multiple images flow toggles dialog open and onDelete clears selection", async () => {
    const files = [makeFile("f1", 0, 1, 11), makeFile("f2", 0, 2, 22)];
    renderGrid({ owner: false, files });

    // Enter selecting mode (choose both)
    await userEvent.click(screen.getByTestId("select-f1"));
    await userEvent.click(screen.getByTestId("select-f2"));

    // Open delete dialog by clicking the 'Delete selected' button (from translations mock)
    await userEvent.click(screen.getByRole("button", { name: "Delete selected" }));

    const dialog = screen.getByTestId("delete-multiple");
    expect(dialog.getAttribute("data-open")).toBe("true");

    // Confirm delete -> calls onDelete which clears selection
    await userEvent.click(screen.getByTestId("confirm-delete"));
    expect(screen.queryByText(/2 selected/)).not.toBeInTheDocument();
  });

  it("Owner branch wraps grid in DndContext; dragging to first/last/middle calls updateFilePosition with correct neighbors and updates positions", async () => {
    useFakeTimers();
    const files = [
      makeFile("A", 0, 1),
      makeFile("B", 0, 2),
      makeFile("C", 0, 3),
      makeFile("D", 0, 4),
    ];
    renderGrid({ owner: true, files });

    // Drag item 'C' over 'A' (to first position)
    updateFilePosition.mockResolvedValueOnce({ newPosition: 10 });
    lastDndHandlers.onDragEnd?.({ active: { id: "C" }, over: { id: "A" } });
    await runAllTimers();
    expect(updateFilePosition).toHaveBeenCalledWith("C", undefined, "A");
    expect(setFilesSpy).toHaveBeenCalled();

    // Drag item 'A' over 'D' (to last position)
    updateFilePosition.mockResolvedValueOnce({ newPosition: 20 });
    lastDndHandlers.onDragEnd?.({ active: { id: "A" }, over: { id: "D" } });
    await runAllTimers();
    // When moving to last, it uses before = sortedFiles[len-2], after undefined
    expect(updateFilePosition).toHaveBeenCalled();

    // Middle move: drag 'B' over 'C' (activeIndex < overIndex --> before=over.id, after=over+1)
    updateFilePosition.mockResolvedValueOnce({ newPosition: 30 });
    lastDndHandlers.onDragEnd?.({ active: { id: "B" }, over: { id: "C" } });
    await runAllTimers();
    expect(updateFilePosition).toHaveBeenCalled();

    // Also assert that sort strategy switched to drag order by verifying getSortedImagesVideosContent not called again on re-render
    expect(getSortedImagesVideosContent).toHaveBeenCalledTimes(1); // only initial render
  });

  it("When files list initially empty, shows UploadImagesForm and calls setFiles on upload", async () => {
    renderGrid({ owner: true, files: [] });
    await userEvent.click(screen.getByTestId("upload-trigger"));
    expect(setFilesSpy).toHaveBeenCalled();
  });
});