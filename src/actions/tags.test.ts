/* 
  Test framework note:
  - These tests are authored for Jest semantics (describe/test/expect and jest.mock).
  - Many projects that use Vitest will also work with minimal changes because the APIs are similar.
  - Please ensure the repository's configured test runner is installed. If using Vitest, 
    replace 'jest' with 'vi' in mocks or add a compatibility shim. 
*/

import * as path from "node:path";

// Relative import to avoid alias issues with "@/"
import {
  createTag,
  addTagsToFile,
  addTagsToFiles,
  removeTagsFromFile,
  removeTagsFromFiles,
} from "./tags";

// Mock external modules used by the actions
// If your project uses TS path aliases and Jest's moduleNameMapper is configured,
// you can switch these to "@/lib/..." as needed.
jest.mock("../lib/dal", () => ({
  hasFolderOwnerAccess: jest.fn(),
}));
jest.mock("../lib/prisma", () => {
  const file = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  };
  const folderTag = {
    create: jest.fn(),
    findMany: jest.fn(),
  };
  return { prisma: { file, folderTag } };
});
jest.mock("../lib/session", () => ({
  getCurrentSession: jest.fn(),
}));

import { prisma } from "../lib/prisma";
import { hasFolderOwnerAccess } from "../lib/dal";
import { getCurrentSession } from "../lib/session";

// Helpers

const makeSession = (id: string = "user-1") => ({ user: { id } } as any);

const makeTag = (over: Partial<any> = {}) => ({
  id: over.id ?? "tag-1",
  name: over.name ?? "Tag 1",
  color: over.color ?? "#ffffff",
  userId: over.userId ?? "user-1",
  folderId: over.folderId ?? "folder-1",
  createdAt: over.createdAt ?? new Date("2025-01-01T00:00:00Z"),
  updatedAt: over.updatedAt ?? new Date("2025-01-01T00:00:00Z"),
});

const makeFile = (over: Partial<any> = {}) => ({
  id: over.id ?? "file-1",
  name: over.name ?? "File 1",
  folderId: over.folderId ?? "folder-1",
  tags: over.tags ?? [],
});

beforeEach(() => {
  jest.resetAllMocks();
});

describe("createTag", () => {
  test("returns error when name is empty", async () => {
    const res = await createTag("", "#abc", "folder-1");
    expect(res).toEqual({ success: false, error: "name is required" });

    // Should short-circuit before access checks or db calls
    expect(hasFolderOwnerAccess).not.toHaveBeenCalled();
    expect(getCurrentSession).not.toHaveBeenCalled();
    expect(prisma.folderTag.create).not.toHaveBeenCalled();
  });

  test("returns unauthorized when user lacks folder owner access", async () => {
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(false);

    const res = await createTag("MyTag", "#abc", "folder-1");
    expect(res).toEqual({ success: false, error: "unauthorized" });

    expect(hasFolderOwnerAccess).toHaveBeenCalledWith("folder-1");
    expect(getCurrentSession).not.toHaveBeenCalled();
    expect(prisma.folderTag.create).not.toHaveBeenCalled();
  });

  test("returns unauthorized when session has no user", async () => {
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(true);
    (getCurrentSession as jest.Mock).mockResolvedValue(null);

    const res = await createTag("MyTag", "#abc", "folder-1");
    expect(res).toEqual({ success: false, error: "unauthorized" });

    expect(getCurrentSession).toHaveBeenCalled();
    expect(prisma.folderTag.create).not.toHaveBeenCalled();
  });

  test("creates tag and connects file when fileId provided", async () => {
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(true);
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));

    const fakeTag = makeTag({ id: "tag-123", name: "MyTag", color: "#abc", folderId: "folder-1", userId: "user-1" });
    (prisma.folderTag.create as jest.Mock).mockResolvedValue(fakeTag);

    const res = await createTag("MyTag", "#abc", "folder-1", "file-9");
    expect(prisma.folderTag.create).toHaveBeenCalledWith({
      data: {
        name: "MyTag",
        color: "#abc",
        folderId: "folder-1",
        files: { connect: { id: "file-9" } },
        userId: "user-1",
      },
    });
    expect(res).toEqual({ success: true, tag: fakeTag });
  });

  test("creates tag without connecting file when fileId not provided", async () => {
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(true);
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));

    const fakeTag = makeTag({ id: "tag-124", name: "SoloTag", color: "#def" });
    (prisma.folderTag.create as jest.Mock).mockResolvedValue(fakeTag);

    const res = await createTag("SoloTag", "#def", "folder-1");
    expect(prisma.folderTag.create).toHaveBeenCalledWith({
      data: {
        name: "SoloTag",
        color: "#def",
        folderId: "folder-1",
        files: undefined,
        userId: "user-1",
      },
    });
    expect(res).toEqual({ success: true, tag: fakeTag });
  });
});

describe("addTagsToFile", () => {
  test("returns error when tagIds is empty", async () => {
    const res = await addTagsToFile("file-1", []);
    expect(res).toEqual({ success: false, error: "no tags to add" });
    expect(getCurrentSession).not.toHaveBeenCalled();
  });

  test("returns unauthorized when session missing", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(null);
    const res = await addTagsToFile("file-1", ["t1"]);
    expect(res).toEqual({ success: false, error: "unauthorized" });
  });

  test("returns file not found when file missing", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await addTagsToFile("missing-file", ["t1"]);
    expect(prisma.file.findUnique).toHaveBeenCalledWith({
      where: { id: "missing-file" },
      include: { tags: true },
    });
    expect(res).toEqual({ success: false, error: "file not found" });
  });

  test("returns unauthorized when no folder owner access for file's folder", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findUnique as jest.Mock).mockResolvedValue(makeFile({ id: "file-1", folderId: "folder-1" }));
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(false);

    const res = await addTagsToFile("file-1", ["t1"]);
    expect(res).toEqual({ success: false, error: "unauthorized" });
  });

  test("returns some tags not found when lookup mismatch", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findUnique as jest.Mock).mockResolvedValue(makeFile({ id: "file-1", folderId: "folder-1" }));
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(true);

    (prisma.folderTag.findMany as jest.Mock).mockResolvedValue([makeTag({ id: "t1" })]); // requested t1 & t2, returns only t1

    const res = await addTagsToFile("file-1", ["t1", "t2"]);
    expect(prisma.folderTag.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ["t1", "t2"] },
        userId: "user-1",
        folderId: "folder-1",
      },
    });
    expect(res).toEqual({ success: false, error: "some tags not found" });
  });

  test("connects only new tags and returns union of existing + new", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    const existing = makeTag({ id: "t1", name: "E" });
    const desired = [existing, makeTag({ id: "t2", name: "N" })];

    (prisma.file.findUnique as jest.Mock).mockResolvedValue(
      makeFile({ id: "file-1", folderId: "folder-1", tags: [existing] })
    );
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(true);
    (prisma.folderTag.findMany as jest.Mock).mockResolvedValue(desired);

    const updatedFile = makeFile({ id: "file-1", tags: desired });
    (prisma.file.update as jest.Mock).mockResolvedValue(updatedFile);

    const res = await addTagsToFile("file-1", ["t1", "t2"]);
    // Should only connect t2 because t1 already exists
    expect(prisma.file.update).toHaveBeenCalledWith({
      where: { id: "file-1" },
      data: { tags: { connect: [{ id: "t2" }] } },
      include: { tags: true },
    });
    expect(res).toEqual({
      success: true,
      tags: expect.arrayContaining(desired),
      file: updatedFile,
    });
    expect((res as any).tags).toHaveLength(2);
  });

  test("still calls update with empty connect when all tags already present (idempotent add)", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    const t1 = makeTag({ id: "t1" });
    const t2 = makeTag({ id: "t2" });
    (prisma.file.findUnique as jest.Mock).mockResolvedValue(
      makeFile({ id: "file-1", folderId: "folder-1", tags: [t1, t2] })
    );
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(true);
    (prisma.folderTag.findMany as jest.Mock).mockResolvedValue([t1, t2]);

    const updatedFile = makeFile({ id: "file-1", tags: [t1, t2] });
    (prisma.file.update as jest.Mock).mockResolvedValue(updatedFile);

    const res = await addTagsToFile("file-1", ["t1", "t2"]);
    expect(prisma.file.update).toHaveBeenCalledWith({
      where: { id: "file-1" },
      data: { tags: { connect: [] } },
      include: { tags: true },
    });
    expect(res).toEqual({
      success: true,
      tags: expect.arrayContaining([t1, t2]),
      file: updatedFile,
    });
  });
});

describe("addTagsToFiles", () => {
  test("returns error when tagIds or filesId empty", async () => {
    const r1 = await addTagsToFiles([], ["t1"]);
    const r2 = await addTagsToFiles(["f1"], []);
    expect(r1).toEqual({ success: false, error: "no tags or files to add" });
    expect(r2).toEqual({ success: false, error: "no tags or files to add" });
  });

  test("returns unauthorized when session missing", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(null);
    const res = await addTagsToFiles(["f1"], ["t1"]);
    expect(res).toEqual({ success: false, error: "unauthorized" });
  });

  test("returns file not found when fewer files returned than requested", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findMany as jest.Mock).mockResolvedValue([makeFile({ id: "f1" })]); // requested f1 & f2
    const res = await addTagsToFiles(["f1", "f2"], ["t1"]);
    expect(res).toEqual({ success: false, error: "file not found" });
  });

  test("returns unauthorized when files belong to different folders", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findMany as jest.Mock).mockResolvedValue([
      makeFile({ id: "f1", folderId: "A" }),
      makeFile({ id: "f2", folderId: "B" }),
    ]);
    const res = await addTagsToFiles(["f1", "f2"], ["t1"]);
    expect(res).toEqual({ success: false, error: "unauthorized" });
  });

  test("returns unauthorized when owner access denied for the shared folder", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findMany as jest.Mock).mockResolvedValue([
      makeFile({ id: "f1", folderId: "A" }),
      makeFile({ id: "f2", folderId: "A" }),
    ]);
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(false);

    const res = await addTagsToFiles(["f1", "f2"], ["t1"]);
    expect(res).toEqual({ success: false, error: "unauthorized" });
  });

  test("returns some tags not found when lookup mismatch", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findMany as jest.Mock).mockResolvedValue([
      makeFile({ id: "f1", folderId: "A" }),
      makeFile({ id: "f2", folderId: "A" }),
    ]);
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(true);

    (prisma.folderTag.findMany as jest.Mock).mockResolvedValue([makeTag({ id: "t1", folderId: "A" })]); // requested t1,t2
    const res = await addTagsToFiles(["f1", "f2"], ["t1", "t2"]);
    expect(res).toEqual({ success: false, error: "some tags not found" });
  });

  test("connects only missing tags for each file and returns updated files", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    const t1 = makeTag({ id: "t1", folderId: "A" });
    const t2 = makeTag({ id: "t2", folderId: "A" });

    const f1 = makeFile({ id: "f1", folderId: "A", tags: [t1] }); // needs t2
    const f2 = makeFile({ id: "f2", folderId: "A", tags: [] });   // needs t1 & t2

    (prisma.file.findMany as jest.Mock).mockResolvedValue([f1, f2]);
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(true);
    (prisma.folderTag.findMany as jest.Mock).mockResolvedValue([t1, t2]);

    const updatedF1 = makeFile({ id: "f1", folderId: "A", tags: [t1, t2] });
    const updatedF2 = makeFile({ id: "f2", folderId: "A", tags: [t1, t2] });

    // Mock file.update progressive calls
    (prisma.file.update as jest.Mock)
      .mockResolvedValueOnce(updatedF1)
      .mockResolvedValueOnce(updatedF2);

    const res = await addTagsToFiles(["f1", "f2"], ["t1", "t2"]);
    // First call: f1 gets t2
    expect(prisma.file.update).toHaveBeenNthCalledWith(1, {
      where: { id: "f1" },
      data: { tags: { connect: [{ id: "t2" }] } },
      include: { tags: true },
    });
    // Second call: f2 gets t1 and t2
    expect(prisma.file.update).toHaveBeenNthCalledWith(2, {
      where: { id: "f2" },
      data: { tags: { connect: [{ id: "t1" }, { id: "t2" }] } },
      include: { tags: true },
    });

    expect(res).toEqual({
      success: true,
      tags: expect.arrayContaining([t1, t2]),
      files: expect.arrayContaining([updatedF1, updatedF2]),
    });
  });
});

describe("removeTagsFromFile", () => {
  test("returns error when tagIds is empty", async () => {
    const res = await removeTagsFromFile("file-1", []);
    expect(res).toEqual({ success: false, error: "no tags to remove" });
  });

  test("returns unauthorized when session missing", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(null);
    const res = await removeTagsFromFile("file-1", ["t1"]);
    expect(res).toEqual({ success: false, error: "unauthorized" });
  });

  test("returns file not found when file missing", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await removeTagsFromFile("missing", ["t1"]);
    expect(res).toEqual({ success: false, error: "file not found" });
  });

  test("returns unauthorized when no owner access", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findUnique as jest.Mock).mockResolvedValue(makeFile({ id: "f1", folderId: "A" }));
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(false);

    const res = await removeTagsFromFile("f1", ["t1"]);
    expect(res).toEqual({ success: false, error: "unauthorized" });
  });

  test("returns some tags not found when lookup mismatch", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findUnique as jest.Mock).mockResolvedValue(makeFile({ id: "f1", folderId: "A" }));
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(true);

    (prisma.folderTag.findMany as jest.Mock).mockResolvedValue([makeTag({ id: "t1", folderId: "A" })]);
    const res = await removeTagsFromFile("f1", ["t1", "t2"]);
    expect(res).toEqual({ success: false, error: "some tags not found" });
  });

  test("disconnects provided tags regardless of whether they existed on the file", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    const existing = makeTag({ id: "t1", folderId: "A" });
    const nonExisting = makeTag({ id: "t2", folderId: "A" });
    const file = makeFile({ id: "f1", folderId: "A", tags: [existing] });

    (prisma.file.findUnique as jest.Mock).mockResolvedValue(file);
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(true);
    (prisma.folderTag.findMany as jest.Mock).mockResolvedValue([existing, nonExisting]);

    const updatedFile = makeFile({ id: "f1", folderId: "A", tags: [] });
    (prisma.file.update as jest.Mock).mockResolvedValue(updatedFile);

    const res = await removeTagsFromFile("f1", ["t1", "t2"]);
    expect(prisma.file.update).toHaveBeenCalledWith({
      where: { id: "f1" },
      data: { tags: { disconnect: [{ id: "t1" }, { id: "t2" }] } },
      include: { tags: true },
    });

    // The function returns [...existingTags, ...newTags]; verify it amounts to the requested tags
    expect(res).toEqual({
      success: true,
      tags: expect.arrayContaining([existing, nonExisting]),
      file: updatedFile,
    });
    expect((res as any).tags).toHaveLength(2);
  });
});

describe("removeTagsFromFiles", () => {
  test("returns error when tagIds or fileIds empty", async () => {
    const r1 = await removeTagsFromFiles([], ["t1"]);
    const r2 = await removeTagsFromFiles(["f1"], []);
    expect(r1).toEqual({ success: false, error: "no tags to remove" });
    expect(r2).toEqual({ success: false, error: "no tags to remove" });
  });

  test("returns unauthorized when session missing", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(null);
    const res = await removeTagsFromFiles(["f1"], ["t1"]);
    expect(res).toEqual({ success: false, error: "unauthorized" });
  });

  test("current implementation: when no files returned by findMany, it yields unauthorized (due to flawed check)", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findMany as jest.Mock).mockResolvedValue([]); // flaw: code checks !files instead of length mismatch
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(false); // called with undefined

    const res = await removeTagsFromFiles(["missing-file"], ["t1"]);
    // Documenting actual behavior to guard against regressions
    expect(res).toEqual({ success: false, error: "unauthorized" });
  });

  test("returns unauthorized when mixed folders", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findMany as jest.Mock).mockResolvedValue([
      makeFile({ id: "f1", folderId: "A" }),
      makeFile({ id: "f2", folderId: "B" }),
    ]);

    const res = await removeTagsFromFiles(["f1", "f2"], ["t1"]);
    expect(res).toEqual({ success: false, error: "unauthorized" });
  });

  test("returns some tags not found when mismatch", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    (prisma.file.findMany as jest.Mock).mockResolvedValue([
      makeFile({ id: "f1", folderId: "A" }),
      makeFile({ id: "f2", folderId: "A" }),
    ]);
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(true);

    (prisma.folderTag.findMany as jest.Mock).mockResolvedValue([makeTag({ id: "t1", folderId: "A" })]); // requested t1,t2

    const res = await removeTagsFromFiles(["f1", "f2"], ["t1", "t2"]);
    expect(res).toEqual({ success: false, error: "some tags not found" });
  });

  test("disconnects all requested tags from each file", async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(makeSession("user-1"));
    const f1 = makeFile({ id: "f1", folderId: "A", tags: [makeTag({ id: "t1" })] });
    const f2 = makeFile({ id: "f2", folderId: "A", tags: [makeTag({ id: "t2" })] });

    (prisma.file.findMany as jest.Mock).mockResolvedValue([f1, f2]);
    (hasFolderOwnerAccess as jest.Mock).mockResolvedValue(true);

    const t1 = makeTag({ id: "t1", folderId: "A" });
    const t2 = makeTag({ id: "t2", folderId: "A" });
    (prisma.folderTag.findMany as jest.Mock).mockResolvedValue([t1, t2]);

    const updatedF1 = makeFile({ id: "f1", folderId: "A", tags: [] });
    const updatedF2 = makeFile({ id: "f2", folderId: "A", tags: [] });

    (prisma.file.update as jest.Mock)
      .mockResolvedValueOnce(updatedF1)
      .mockResolvedValueOnce(updatedF2);

    const res = await removeTagsFromFiles(["f1", "f2"], ["t1", "t2"]);

    expect(prisma.file.update).toHaveBeenNthCalledWith(1, {
      where: { id: "f1" },
      data: { tags: { disconnect: [{ id: "t1" }, { id: "t2" }] } },
      include: { tags: true },
    });
    expect(prisma.file.update).toHaveBeenNthCalledWith(2, {
      where: { id: "f2" },
      data: { tags: { disconnect: [{ id: "t1" }, { id: "t2" }] } },
      include: { tags: true },
    });

    expect(res).toEqual({
      success: true,
      tags: expect.arrayContaining([t1, t2]),
      files: expect.arrayContaining([updatedF1, updatedF2]),
    });
  });
});