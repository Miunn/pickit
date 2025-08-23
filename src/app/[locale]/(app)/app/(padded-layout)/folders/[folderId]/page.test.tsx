/**
 * Tests for src/app/[locale]/(app)/app/(padded-layout)/folders/[folderId]/page.tsx
 *
 * Framework/Libraries: Jest + @testing-library/react (server component return value checked without DOM when necessary)
 * Strategy:
 *  - Unit-test generateMetadata with different searchParams/DB outcomes
 *  - Unit-test FolderPage behavior for access control, redirects, token increment, and rendering
 *  - Mock all external modules (prisma, isAllowedToAccessFolder, navigation.redirect, getTranslations, getSortedFolderContent,
 *    generateV4DownloadUrl, FolderContent, Providers, etc.)
 *  - Validate inputs/outputs and side-effects (e.g., fetch call for token increment)
 */

import React from "react";
import type { Metadata } from "next";
import { ImagesSortMethod } from "@/components/folders/SortImages";
import { ViewState } from "@/components/folders/ViewSelector";

// Import module under test
// We import with wildcard to access named export generateMetadata and default export
import * as FolderPageModule from "./page";

// -------------------- Mocks --------------------

// Mock i18n/navigation redirect to be a jest mock that returns a sentinel value
jest.mock("@/i18n/navigation", () => ({
  redirect: jest.fn((args: { href: string; locale: string }) => ({
    __redirect__: true,
    ...args,
  })),
}));

// Mock next-intl/server getTranslations to return a function t(k, { folderName })
jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(async (_ns: string) => {
    const map: Record<string, string> = {
      "title": "Title: {folderName}",
      "description": "Description: {folderName}",
      "openGraph.title": "OG Title: {folderName}",
      "openGraph.description": "OG Description: {folderName}",
    };
    return (key: string, vars: { folderName: string }) => {
      const tmpl = map[key] ?? key;
      return tmpl.replace("{folderName}", vars.folderName);
    };
  }),
}));

// Mock prisma client used in the module
const prismaAccessTokenFindUniqueMock = jest.fn();
const prismaFolderFindUniqueMock = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    accessToken: { findUnique: (...args: any[]) => prismaAccessTokenFindUniqueMock(...args) },
    folder: { findUnique: (...args: any[]) => prismaFolderFindUniqueMock(...args) },
  },
}));

// Mock DAL isAllowedToAccessFolder
const isAllowedToAccessFolderMock = jest.fn();
jest.mock("@/lib/dal", () => ({
  isAllowedToAccessFolder: (...args: any[]) => isAllowedToAccessFolderMock(...args),
}));

// Mock bucket signed URL generator
const generateV4DownloadUrlMock = jest.fn();
jest.mock("@/lib/bucket", () => ({
  generateV4DownloadUrl: (...args: any[]) => generateV4DownloadUrlMock(...args),
}));

// Mock utils sorting
const getSortedFolderContentMock = jest.fn();
jest.mock("@/lib/utils", () => ({
  getSortedFolderContent: (...args: any[]) => getSortedFolderContentMock(...args),
}));

// Mock presentational/components and providers to simple pass-throughs/markers
jest.mock("@/components/folders/FolderContent", () => ({
  FolderContent: () => React.createElement("div", { "data-testid": "FolderContent" }),
}));
jest.mock("@/components/folders/UnlockTokenPrompt", () => ({
  __esModule: true,
  default: (props: any) =>
    React.createElement("div", { "data-testid": "UnlockTokenPrompt", ...props }),
}));
jest.mock("@/components/layout/BreadcrumbPortal", () => ({
  __esModule: true,
  default: ({ children }: any) =>
    React.createElement("div", { "data-testid": "BreadcrumbPortal" }, children),
}));
jest.mock("@/components/layout/HeaderBreadcumb", () => ({
  __esModule: true,
  default: (props: any) =>
    React.createElement("div", { "data-testid": "HeaderBreadcumb", ...props }),
}));
jest.mock("@/context/FolderContext", () => ({
  FolderProvider: ({ children, ...rest }: any) =>
    React.createElement("div", { "data-testid": "FolderProvider", props: rest }, children),
}));
jest.mock("@/context/FilesContext", () => ({
  FilesProvider: ({ children, ...rest }: any) =>
    React.createElement("div", { "data-testid": "FilesProvider", props: rest }, children),
}));
jest.mock("@/context/TokenContext", () => ({
  TokenProvider: ({ children, ...rest }: any) =>
    React.createElement("div", { "data-testid": "TokenProvider", props: rest }, children),
}));

// -------------------- Test Utilities --------------------

const ORIGINAL_ENV = { ...process.env };
beforeEach(() => {
  jest.resetAllMocks();
  process.env = { ...ORIGINAL_ENV, NEXT_PUBLIC_APP_URL: "https://example.test" };
  // Default sorted content mock passes through folder unchanged
  getSortedFolderContentMock.mockImplementation((folder: any) => folder);
});
afterAll(() => {
  process.env = ORIGINAL_ENV;
});

// Helper to resolve the module's exports freshly (ensures mocks are applied)
const getSut = () => FolderPageModule;

// -------------------- generateMetadata tests --------------------

describe("generateMetadata", () => {
  it("returns default metadata when share is missing", async () => {
    const { generateMetadata } = getSut();
    const meta = await generateMetadata({
      params: Promise.resolve({ folderId: "fid-1", locale: "en" }),
      searchParams: Promise.resolve({ /* no share */ }),
    });

    expect(meta.title).toBe("Title: Folder");
    expect(meta.description).toBe("Description: Folder");
    expect(meta.openGraph?.title).toBe("Title: Folder");
    expect(meta.openGraph?.description).toBe("Description: Folder");
    // images should be undefined in default case
    expect((meta as any).openGraph?.images).toBeUndefined();
  });

  it("returns default (openGraph specific) metadata when token not found or has no folder", async () => {
    prismaAccessTokenFindUniqueMock.mockResolvedValueOnce(null);

    const { generateMetadata } = getSut();
    const meta = await generateMetadata({
      params: Promise.resolve({ folderId: "fid-xyz", locale: "en" }),
      searchParams: Promise.resolve({ share: "tok123" }),
    });

    expect(meta.title).toBe("Title: Folder");
    expect(meta.description).toBe("Description: Folder");
    expect(meta.openGraph?.title).toBe("OG Title: Folder");
    expect(meta.openGraph?.description).toBe("OG Description: Folder");
    expect((meta as any).openGraph?.images).toBeUndefined();
    expect(prismaAccessTokenFindUniqueMock).toHaveBeenCalledWith({
      where: { token: "tok123" },
      select: { folder: { select: { name: true, description: true } } },
    });
  });

  it("returns metadata using folder name and optional description and constructs image URL with query params", async () => {
    prismaAccessTokenFindUniqueMock.mockResolvedValueOnce({
      folder: { name: "Summer", description: "Album" },
    });

    const { generateMetadata } = getSut();
    const meta = await generateMetadata({
      params: Promise.resolve({ folderId: "folder-1", locale: "en" }),
      searchParams: Promise.resolve({ share: "abc", h: "sig" }),
    });

    expect(meta.title).toBe("Title: Summer");
    expect(meta.description).toBe("Album");
    expect(meta.openGraph?.title).toBe("OG Title: Summer");
    expect(meta.openGraph?.description).toBe("Album");
    const images = (meta.openGraph as any)?.images ?? [];
    expect(images).toHaveLength(1);
    expect(images[0].alt).toBe("Echomori");
    expect(images[0].type).toBe("image/png");
    expect(images[0].width).toBe(1200);
    expect(images[0].height).toBe(630);
    expect(images[0].url).toBe(
      "https://example.test/api/folders/folder-1/og?share=abc&h=sig"
    );
  });

  it("uses translation description when folder description is null/empty", async () => {
    prismaAccessTokenFindUniqueMock.mockResolvedValueOnce({
      folder: { name: "Holiday", description: null },
    });

    const { generateMetadata } = getSut();
    const meta = await generateMetadata({
      params: Promise.resolve({ folderId: "f-2", locale: "en" }),
      searchParams: Promise.resolve({ share: "sh-2" }),
    });

    expect(meta.description).toBe("Description: Holiday");
    expect(meta.openGraph?.description).toBe("OG Description: Holiday");
  });
});

// -------------------- FolderPage tests --------------------

describe("FolderPage (default export)", () => {
  const renderFromJsx = async (element: React.ReactElement) => {
    // For server components, we can inspect the element tree without DOM rendering
    return element as any;
  };

  it("redirects to /signin when hasAccess === 0 and no share", async () => {
    isAllowedToAccessFolderMock.mockResolvedValueOnce(0);

    const { default: FolderPage } = getSut();
    const props = {
      params: Promise.resolve({ folderId: "fid-1", locale: "en" }),
      searchParams: Promise.resolve({}),
    };
    const result = await FolderPage(props as any);
    const { redirect } = require("@/i18n/navigation");
    expect(redirect).toHaveBeenCalledWith({ href: "/signin", locale: "en" });
    expect((result as any)?.__redirect__).toBe(true);
  });

  it("redirects to invalid link when hasAccess === 0 and share present", async () => {
    isAllowedToAccessFolderMock.mockResolvedValueOnce(0);

    const { default: FolderPage } = getSut();
    const result = await FolderPage({
      params: Promise.resolve({ folderId: "fid-2", locale: "fr" }),
      searchParams: Promise.resolve({ share: "tok-1" }),
    } as any);
    const { redirect } = require("@/i18n/navigation");
    expect(redirect).toHaveBeenCalledWith({
      href: "/links/invalid/tok-1",
      locale: "fr",
    });
    expect((result as any)?.__redirect__).toBe(true);
  });

  it("renders UnlockTokenPrompt with wrongPin=false when hasAccess === 2 and valid accessToken exists", async () => {
    isAllowedToAccessFolderMock.mockResolvedValueOnce(2);
    prismaAccessTokenFindUniqueMock.mockResolvedValueOnce({
      token: "tok",
      folder: { name: "Locked Folder" },
    });

    const { default: FolderPage } = getSut();
    const jsx: any = await FolderPage({
      params: Promise.resolve({ folderId: "fid-3", locale: "en" }),
      searchParams: Promise.resolve({ share: "tok" }),
    } as any);

    // Shallow inspect children markers
    const asString = JSON.stringify(jsx);
    expect(asString).toContain('"data-testid":"BreadcrumbPortal"');
    expect(asString).toContain('"data-testid":"HeaderBreadcumb"');
    expect(asString).toContain('"data-testid":"UnlockTokenPrompt"');
    // wrongPin false for hasAccess 2
    expect(asString).toContain('"wrongPin":false');
  });

  it("renders UnlockTokenPrompt with wrongPin=true when hasAccess === 3 and valid accessToken exists", async () => {
    isAllowedToAccessFolderMock.mockResolvedValueOnce(3);
    prismaAccessTokenFindUniqueMock.mockResolvedValueOnce({
      token: "tok",
      folder: { name: "Locked Folder" },
    });

    const { default: FolderPage } = getSut();
    const jsx: any = await FolderPage({
      params: Promise.resolve({ folderId: "fid-3", locale: "en" }),
      searchParams: Promise.resolve({ share: "tok" }),
    } as any);

    const asString = JSON.stringify(jsx);
    expect(asString).toContain('"data-testid":"UnlockTokenPrompt"');
    expect(asString).toContain('"wrongPin":true');
  });

  it("redirects to invalid link when hasAccess === 2/3 but accessToken is missing", async () => {
    isAllowedToAccessFolderMock.mockResolvedValueOnce(2);
    prismaAccessTokenFindUniqueMock.mockResolvedValueOnce(null);

    const { default: FolderPage } = getSut();
    const result = await FolderPage({
      params: Promise.resolve({ folderId: "fid-4", locale: "en" }),
      searchParams: Promise.resolve({ share: "badtok" }),
    } as any);

    const { redirect } = require("@/i18n/navigation");
    expect(redirect).toHaveBeenCalledWith({
      href: "/links/invalid/badtok",
      locale: "en",
    });
    expect((result as any)?.__redirect__).toBe(true);
  });

  it("redirects to /folders when folder not found", async () => {
    isAllowedToAccessFolderMock.mockResolvedValueOnce(1);
    prismaFolderFindUniqueMock.mockResolvedValueOnce(null);

    const { default: FolderPage } = getSut();
    const result = await FolderPage({
      params: Promise.resolve({ folderId: "missing", locale: "en" }),
      searchParams: Promise.resolve({}),
    } as any);

    const { redirect } = require("@/i18n/navigation");
    expect(redirect).toHaveBeenCalledWith({ href: "/folders", locale: "en" });
    expect((result as any)?.__redirect__).toBe(true);
  });

  it("when share present, increments token usage via fetch and renders folder content providers tree", async () => {
    isAllowedToAccessFolderMock.mockResolvedValueOnce(1);
    // Provide a folder with files and access tokens
    prismaFolderFindUniqueMock.mockResolvedValueOnce({
      id: "f-1",
      name: "My Folder",
      files: [
        { id: "file-1", folderId: "f-1", createdById: "u-1" },
        { id: "file-2", folderId: "f-1", createdById: "u-2" },
      ],
      tags: [],
      createdBy: { id: "u-owner" },
      accessTokens: [{ email: "a@example.com" }, { email: null }],
    });

    generateV4DownloadUrlMock.mockResolvedValue("https://signed.example.com/x");
    prismaAccessTokenFindUniqueMock.mockResolvedValueOnce({
      token: "tok",
      folder: { id: "f-1", name: "My Folder" },
    });

    const fetchSpy = jest.fn().mockResolvedValue({ ok: true });
    // @ts-expect-error override global
    global.fetch = fetchSpy;

    const { default: FolderPage } = getSut();
    const jsx: any = await FolderPage({
      params: Promise.resolve({ folderId: "f-1", locale: "en" }),
      searchParams: Promise.resolve({
        share: "tok",
        h: "sig",
        sort: ImagesSortMethod.DateDesc,
        view: ViewState.Grid,
      }),
    } as any);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.test/api/tokens/increment?token=tok"
    );

    // ensure signed urls were requested for each file
    expect(generateV4DownloadUrlMock).toHaveBeenCalledTimes(2);
    expect(generateV4DownloadUrlMock).toHaveBeenNthCalledWith(
      1,
      "u-1/f-1/file-1"
    );
    expect(generateV4DownloadUrlMock).toHaveBeenNthCalledWith(
      2,
      "u-2/f-1/file-2"
    );

    // Verify providers and content presence and key props
    const asString = JSON.stringify(jsx);
    expect(asString).toContain('"data-testid":"BreadcrumbPortal"');
    expect(asString).toContain('"data-testid":"HeaderBreadcumb"');
    expect(asString).toContain('"data-testid":"FolderProvider"');
    expect(asString).toContain('"data-testid":"TokenProvider"');
    expect(asString).toContain('"data-testid":"FilesProvider"');
    expect(asString).toContain('"data-testid":"FolderContent"');

    // isShared should be true because at least one accessToken has email
    expect(asString).toContain('"isShared":true');
  });

  it("passes default sort/view when not provided in searchParams", async () => {
    isAllowedToAccessFolderMock.mockResolvedValueOnce(1);
    prismaFolderFindUniqueMock.mockResolvedValueOnce({
      id: "f-2",
      name: "Folder",
      files: [],
      tags: [],
      createdBy: { id: "u" },
      accessTokens: [],
    });
    prismaAccessTokenFindUniqueMock.mockResolvedValueOnce(null);
    generateV4DownloadUrlMock.mockResolvedValue("https://signed.example.com/x");

    const { default: FolderPage } = getSut();
    const jsx: any = await FolderPage({
      params: Promise.resolve({ folderId: "f-2", locale: "en" }),
      searchParams: Promise.resolve({}),
    } as any);

    const asString = JSON.stringify(jsx);
    // default view Grid
    expect(asString).toContain(`"defaultView":${ViewState.Grid}`);
    // default sort DateDesc is passed via getSortedFolderContent; assert it was called with the default
    expect(getSortedFolderContentMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "f-2" }),
      ImagesSortMethod.DateDesc
    );
  });
});