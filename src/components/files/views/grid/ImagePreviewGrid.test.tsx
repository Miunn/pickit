/**
 * Tests for ImagePreviewGrid:
 * - Framework: React Testing Library with Vitest/Jest style APIs
 * - Focus: behaviors introduced/covered in the provided component, including "new" banner overlay,
 *   conditional context menu options, video vs image rendering, selection styles, tag management,
 *   drag style application, downloads, and changeFolderCover toast flows.
 */

import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mocks for external modules and providers
import { FileType } from "@prisma/client";

// SUT
import { ImagePreviewGrid, ImagePreviewProps } from "./ImagePreviewGrid";

// ---- Begin module mocks ----

// 1) next-intl
vi.mock("next-intl", () => {
  return {
    useTranslations: (ns?: string) => {
      return (key: string) => `${key}`; // echo key for predictability
    },
    useFormatter: () => ({
      dateTime: (_: any, __?: any) => "Formatted Date",
    }),
  };
});

// 2) next/navigation
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "share") return "shareToken";
      if (key === "h") return "hashPin";
      if (key === "t") return "tokenType";
      return null;
    },
  }),
}));

// 3) SessionProvider
vi.mock("@/providers/SessionProvider", () => ({
  useSession: () => ({ user: { id: "user-1" } }),
}));

// 4) FilesContext
const mockSetFiles = vi.fn();
vi.mock("@/context/FilesContext", () => ({
  useFilesContext: () => ({ setFiles: mockSetFiles }),
}));

// 5) actions
const mockChangeFolderCover = vi.fn();
const mockAddTagsToFile = vi.fn();
const mockRemoveTagsFromFile = vi.fn();

vi.mock("@/actions/folders", () => ({
  changeFolderCover: (...args: any[]) => mockChangeFolderCover(...args),
}));

vi.mock("@/actions/tags", () => ({
  addTagsToFile: (...args: any[]) => mockAddTagsToFile(...args),
  removeTagsFromFile: (...args: any[]) => mockRemoveTagsFromFile(...args),
}));

// 6) utils
const mockDownload = vi.fn();
vi.mock("@/lib/utils", async (orig) => {
  const actual = await (orig as any)();
  return {
    ...actual,
    cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
    downloadClientImageHandler: (file: any) => mockDownload(file),
    formatBytes: (_: number) => "1.2 MB",
  };
});

// 7) sonner toast
const mockSonnerError = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: any[]) => mockSonnerError(...args),
  },
}));

// 8) shadcn/toast hook
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  toast: (opts: any) => mockToast(opts),
}));

// 9) UI wrappers simplified
vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ asChild, children }: any) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

vi.mock("@/components/ui/context-menu", () => ({
  ContextMenu: ({ children }: any) => <div data-testid="context-menu">{children}</div>,
  ContextMenuTrigger: ({ asChild, children }: any) => <div data-testid="context-menu-trigger">{children}</div>,
  ContextMenuContent: ({ children }: any) => <div data-testid="context-menu-content">{children}</div>,
  ContextMenuItem: ({ onClick, className, children }: any) => (
    <button data-testid="context-menu-item" className={className} onClick={onClick}>
      {children}
    </button>
  ),
  ContextMenuSeparator: () => <hr data-testid="context-menu-separator" />,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

// 10) TagChip simplified
vi.mock("@/components/tags/TagChip", () => ({
  default: ({ tag }: any) => <span data-testid={`tag-chip-${tag.id}`}>{String(tag.name)}</span>,
}));

// 11) LoadingImage -> simple img
vi.mock("@/components/files/LoadingImage", () => ({
  default: (props: any) => <img data-testid="loading-image" alt={props.alt} src={props.src} />,
}));

// 12) Dialogs simplified
vi.mock("../../RenameImageDialog", () => ({
  default: ({ children }: any) => <div data-testid="rename-dialog">{children}</div>,
}));
vi.mock("../../DeleteImageDialog", () => ({
  DeleteImageDialog: ({ children }: any) => <div data-testid="delete-dialog">{children}</div>,
}));
vi.mock("../../ImagePropertiesDialog", () => ({
  default: ({ children }: any) => <div data-testid="properties-dialog">{children}</div>,
}));

// 13) ManageTagsDialog: expose buttons to trigger callbacks
vi.mock("../../ManageTagsDialog", () => ({
  default: ({ onTagAdded, onTagSelected, onTagUnselected, children }: any) => (
    <div data-testid="manage-tags">
      <button onClick={() => onTagAdded?.({ id: "t-add", name: "added", color: "#000" })} data-testid="btn-add-tag">addTag</button>
      <button onClick={() => onTagSelected?.({ id: "t-select", name: "select", color: "#111" })} data-testid="btn-select-tag">selectTag</button>
      <button onClick={() => onTagUnselected?.({ id: "t-un", name: "un", color: "#222" })} data-testid="btn-unselect-tag">unTag</button>
      {children}
    </div>
  ),
}));

// 14) lucide-react icons
vi.mock("lucide-react", () => ({
  CirclePlay: () => <div data-testid="circle-play-icon" />,
}));

// 15) dnd-kit
vi.mock("@dnd-kit/sortable", () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: { x: 5, y: 10, scaleX: 1, scaleY: 1 },
    transition: "transform 200ms ease",
  }),
}));
vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Translate: {
      toString: () => "translate3d(5px,10px,0)",
    },
  },
}));

// ---- Test helpers ----
const baseTag = (id: string, name: string, color = "#f00") => ({
  id,
  name,
  color,
  createdAt: new Date(),
  updatedAt: new Date(),
  folderId: "folder-1",
  userId: "user-1",
});

const makeFile = (overrides: Partial<ImagePreviewProps["file"]> = {}): ImagePreviewProps["file"] => ({
  id: "file-1",
  name: "photo.jpg",
  size: 1234,
  type: FileType.IMAGE,
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // within 3 days
  createdById: "user-1",
  folderId: "folder-1",
  tags: [baseTag("t1", "alpha"), baseTag("t2", "beta")],
  folder: {
    id: "folder-1",
    name: "Folder",
    tags: [baseTag("t1", "alpha"), baseTag("t2", "beta"), baseTag("t3", "gamma")],
  } as any,
  ...overrides,
});

const renderSut = (props?: Partial<ImagePreviewProps>) => {
  const onClick = vi.fn();
  const onSelect = vi.fn();
  const selected: string[] = props?.selected ?? [];
  const file = makeFile(props?.file as any);
  const result = render(
    <ImagePreviewGrid
      file={file}
      selected={selected}
      onClick={onClick}
      onSelect={onSelect}
      className="custom-class"
    />
  );
  return { ...result, file, onClick, onSelect };
};

// ---- Tests ----

describe("ImagePreviewGrid - basic rendering and 'new' banner", () => {
  it("renders image thumbnail, name, formatted date and size, and shows 'new' banner for files <= 3 days old", () => {
    const { file } = renderSut();
    // Image path for IMAGE type
    const img = screen.getByTestId("loading-image");
    expect(img).toHaveAttribute(
      "src",
      `/api/folders/${file.folderId}/images/${file.id}?share=shareToken&h=hashPin&t=tokenType`
    );
    expect(screen.getByText(file.name)).toBeInTheDocument();
    expect(screen.getAllByText("Formatted Date")[0]).toBeInTheDocument();
    expect(screen.getByText("1.2 MB")).toBeInTheDocument();

    // 'new' banner overlay
    expect(screen.getByText("new")).toBeInTheDocument();

    // First tag and "+N" chip
    expect(screen.getByTestId("tag-chip-t1")).toHaveTextContent("alpha");
    expect(screen.getByText("+1")).toBeInTheDocument();

    // Tooltip content lists remaining tags
    expect(screen.getByTestId("tooltip-content")).toHaveTextContent("beta");
  });

  it("does not show 'new' banner when file is older than 3 days", () => {
    renderSut({
      file: {
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      } as any,
    });
    expect(screen.queryByText("new")).not.toBeInTheDocument();
  });
});

describe("ImagePreviewGrid - selection styles and dnd style", () => {
  it("applies bg-accent and scale-95 when selected", () => {
    renderSut({ selected: ["file-1"] });
    // bg-accent and scale-95 classes should exist somewhere in the tree
    expect(document.body.querySelector(".bg-accent")).toBeTruthy();
    expect(document.body.querySelector(".scale-95")).toBeTruthy();
  });

  it("applies transform style on the button when user owns the file", () => {
    const { onClick } = renderSut();
    const button = screen.getByRole("button");
    expect(button.getAttribute("style") || "").toContain("translate3d(5px,10px,0)");
    // onClick is wired through
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not apply transform style when file is not owned by user", () => {
    renderSut({
      file: { createdById: "another-user" } as any,
    });
    const button = screen.getByRole("button");
    // style should be empty/undefined
    expect(button.getAttribute("style")).toBeNull();
  });
});

describe("ImagePreviewGrid - video vs image rendering", () => {
  it("renders CirclePlay icon and video thumbnail for videos", () => {
    const fileOverrides = {
      type: FileType.VIDEO,
      id: "vid-1",
      name: "clip.mp4",
    } as any;
    const { file } = renderSut({ file: fileOverrides });
    expect(screen.getByTestId("circle-play-icon")).toBeInTheDocument();
    const img = screen.getByTestId("loading-image");
    expect(img).toHaveAttribute(
      "src",
      `/api/folders/${file.folderId}/videos/${file.id}/thumbnail?share=shareToken&h=hashPin&t=tokenType`
    );
  });
});

describe("ImagePreviewGrid - context menu items and actions", () => {
  beforeEach(() => {
    mockDownload.mockReset();
    mockToast.mockReset();
    mockChangeFolderCover.mockReset();
    mockSetFiles.mockReset();
    mockAddTagsToFile.mockReset();
    mockRemoveTagsFromFile.mockReset();
    mockSonnerError.mockReset();
  });

  it("shows owner-only menu items for owner and triggers download handler", async () => {
    renderSut();

    // Menu is inline (mocked), check presence
    expect(screen.getByText("actions.view")).toBeInTheDocument();
    expect(screen.getByText("actions.select")).toBeInTheDocument();
    expect(screen.getByText("actions.rename")).toBeInTheDocument();
    expect(screen.getByText("actions.setAsCover.label")).toBeInTheDocument();
    expect(screen.getByText("actions.properties")).toBeInTheDocument();
    expect(screen.getByText("trigger")).toBeInTheDocument(); // delete dialog trigger text via deleteTranslations mock

    // Download click
    userEvent.click(screen.getAllByTestId("context-menu-item").find(el => el.textContent === "actions.download")!);
    expect(mockDownload).toHaveBeenCalledTimes(1);
    expect(mockDownload.mock.calls[0][0]).toMatchObject({ id: "file-1" });
  });

  it("hides owner-only menu items for non-owner", () => {
    renderSut({ file: { createdById: "not-owner" } as any });

    expect(screen.getByText("actions.view")).toBeInTheDocument();
    expect(screen.queryByText("actions.select")).not.toBeInTheDocument();
    expect(screen.queryByText("actions.rename")).not.toBeInTheDocument();
    expect(screen.queryByText("actions.setAsCover.label")).not.toBeInTheDocument();
    expect(screen.getByText("actions.properties")).toBeInTheDocument();
    expect(screen.queryByText("trigger")).not.toBeInTheDocument();
    // ManageTagsDialog should be absent in menu for non-owner (wrapped inside owner check)
    expect(screen.queryByTestId("manage-tags")).not.toBeInTheDocument();
  });

  it("does not show 'Set as cover' for non-image files", () => {
    renderSut({ file: { type: FileType.VIDEO } as any });
    expect(screen.queryByText("actions.setAsCover.label")).not.toBeInTheDocument();
  });

  it("invokes changeFolderCover and shows success toast on success", async () => {
    mockChangeFolderCover.mockResolvedValueOnce({ error: null });
    renderSut();
    userEvent.click(screen.getAllByTestId("context-menu-item").find(el => el.textContent === "actions.setAsCover.label")!);
    // Await any pending promises
    await Promise.resolve();
    expect(mockChangeFolderCover).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "actions.setAsCover.success.title",
      description: "actions.setAsCover.success.description",
    }));
  });

  it("shows destructive toast on failure to set as cover", async () => {
    mockChangeFolderCover.mockResolvedValueOnce({ error: "oops" });
    renderSut();
    userEvent.click(screen.getAllByTestId("context-menu-item").find(el => el.textContent === "actions.setAsCover.label")!);
    await Promise.resolve();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "actions.setAsCover.errors.unknown.title",
      description: "actions.setAsCover.errors.unknown.description",
      variant: "destructive",
    }));
  });
});

describe("ImagePreviewGrid - tag selection flows", () => {
  beforeEach(() => {
    mockSetFiles.mockReset();
    mockAddTagsToFile.mockReset();
    mockRemoveTagsFromFile.mockReset();
    mockSonnerError.mockReset();
  });

  it("optimistically adds a tag and keeps it on success", async () => {
    mockAddTagsToFile.mockResolvedValueOnce({ success: true });
    renderSut();

    userEvent.click(screen.getByTestId("btn-select-tag"));
    await Promise.resolve();
    // setFiles called optimistically
    expect(mockSetFiles).toHaveBeenCalled();
    // no error toast
    expect(mockSonnerError).not.toHaveBeenCalled();
  });

  it("reverts and shows error when addTagsToFile fails", async () => {
    mockAddTagsToFile.mockResolvedValueOnce({ success: false });
    renderSut();

    userEvent.click(screen.getByTestId("btn-select-tag"));
    await Promise.resolve();
    // setFiles called for optimistic add and revert
    expect(mockSetFiles).toHaveBeenCalledTimes(2);
    expect(mockSonnerError).toHaveBeenCalledWith("addTag.errorAdd");
  });

  it("optimistically removes a tag and keeps it removed on success", async () => {
    mockRemoveTagsFromFile.mockResolvedValueOnce({ success: true });
    renderSut();

    userEvent.click(screen.getByTestId("btn-unselect-tag"));
    await Promise.resolve();
    expect(mockSetFiles).toHaveBeenCalled();
    expect(mockSonnerError).not.toHaveBeenCalled();
  });

  it("reverts and shows error when removeTagsFromFile fails", async () => {
    mockRemoveTagsFromFile.mockResolvedValueOnce({ success: false });
    renderSut();

    userEvent.click(screen.getByTestId("btn-unselect-tag"));
    await Promise.resolve();
    // setFiles called for optimistic remove and revert
    expect(mockSetFiles).toHaveBeenCalledTimes(2);
    expect(mockSonnerError).toHaveBeenCalledWith("addTag.errorRemove");
  });
});