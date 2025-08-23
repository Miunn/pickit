/**
 * Tests for FolderProvider and useFolderContext.
 *
 * Testing library/framework: This suite is written for React Testing Library with Jest by default.
 * If your repo uses Vitest, the included "compat" shim maps jest -> vi automatically.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

// Compat shim: support Vitest by remapping jest.* to vi.* when present
// (no-op under Jest). This avoids introducing a new dependency.
declare const vi: any;
const compat = {
  spyOn: (obj: any, method: any) => (typeof vi !== "undefined" ? vi.spyOn(obj, method) : jest.spyOn(obj, method)),
  fn: (...args: any[]) => (typeof vi !== "undefined" ? vi.fn(...args) : jest.fn(...args)),
  mock: (path: string, factory?: any) => (typeof vi !== "undefined" ? vi.mock(path as any, factory) : jest.mock(path as any, factory)),
  resetAllMocks: () => (typeof vi !== "undefined" ? vi.resetAllMocks() : jest.resetAllMocks()),
  clearAllMocks: () => (typeof vi !== "undefined" ? vi.clearAllMocks() : jest.clearAllMocks()),
};

// System under test
import { FolderProvider, useFolderContext } from "./FolderContext";

/**
 * Mock external modules used inside FolderProvider:
 * - "@/lib/e2ee/vault" (createVault, loadVault)
 * - "@/actions/folders" (updateFolderKey)
 * - "./E2EEncryptionContext" (useE2EEncryptionContext)
 */
const mockCreateVault = compat.fn();
const mockLoadVault = compat.fn();
const mockUpdateFolderKey = compat.fn();

compat.mock("@/lib/e2ee/vault", () => ({
  createVault: (...args: any[]) => mockCreateVault(...args),
  loadVault: (...args: any[]) => mockLoadVault(...args),
}));

compat.mock("@/actions/folders", () => ({
  updateFolderKey: (...args: any[]) => mockUpdateFolderKey(...args),
}));

// Mock E2EEncryptionContext to control the wrappingKey returned by the hook
let wrappingKeyValue: CryptoKey | null = null;
compat.mock("./E2EEncryptionContext", () => ({
  useE2EEncryptionContext: () => ({ wrappingKey: wrappingKeyValue }),
}));

// Minimal helpers and fixtures
type AnyFolder = any; // Types come from "@/lib/definitions" in app code; not needed for runtime tests

const baseFolder = (overrides: Partial<AnyFolder> = {}): AnyFolder => ({
  id: "folder-123",
  key: undefined,
  iv: undefined,
  tags: [],
  createdBy: { id: "user-1" },
  accessToken: null,
  filesCount: 0,
  cover: null,
  ...overrides,
});

const tokenFixture = (overrides: any = {}) => ({
  id: "token-1",
  createdAt: new Date().toISOString(),
  ...overrides,
});

function Consumer() {
  const { folder, setFolder, token, setToken, tokenHash, isShared } = useFolderContext();
  return (
    <div>
      <div data-testid="folder-id">{folder?.id ?? ""}</div>
      <div data-testid="folder-key">{folder?.key ?? ""}</div>
      <div data-testid="folder-iv">{folder?.iv ?? ""}</div>
      <div data-testid="token">{token ? token.id : ""}</div>
      <div data-testid="token-hash">{tokenHash ?? ""}</div>
      <div data-testid="is-shared">{String(isShared)}</div>
      <button
        onClick={() => {
          setFolder((f: AnyFolder) => ({ ...f, tags: ["x"] }));
          setToken(tokenFixture({ id: "token-2" }));
        }}
      >
        mutate
      </button>
    </div>
  );
}

describe("useFolderContext", () => {
  it("throws if used outside FolderProvider", () => {
    const consoleError = compat.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(/useFolderContext must be used within a FolderProvider/);
    consoleError.mockRestore();
  });
});

describe("FolderProvider basics", () => {
  beforeEach(() => {
    compat.resetAllMocks();
    wrappingKeyValue = null;
  });

  it("exposes initial props via context and allows state updates", async () => {
    const initialFolder = baseFolder({ id: "folder-A" });
    const token = tokenFixture({ id: "token-1" });

    render(
      <FolderProvider
        folderData={initialFolder}
        tokenData={token}
        tokenHash="hash-abc"
        isShared={true}
      >
        <Consumer />
      </FolderProvider>
    );

    // Initial render should reflect provided values
    expect(screen.getByTestId("folder-id").textContent).toBe("folder-A");
    expect(screen.getByTestId("token").textContent).toBe("token-1");
    expect(screen.getByTestId("token-hash").textContent).toBe("hash-abc");
    expect(screen.getByTestId("is-shared").textContent).toBe("true");

    // Mutate via exposed setters
    screen.getByText("mutate").click();
    await waitFor(() => {
      expect(screen.getByTestId("token").textContent).toBe("token-2");
    });
  });
});

describe("FolderProvider key management side-effects", () => {
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalLog = console.log;

  beforeEach(() => {
    compat.resetAllMocks();
    console.warn = jest ? jest.fn() : ((..._args:any[]) => {});
    console.error = jest ? jest.fn() : ((..._args:any[]) => {});
    console.log = jest ? jest.fn() : ((..._args:any[]) => {});
  });

  afterEach(() => {
    console.warn = originalWarn;
    console.error = originalError;
    console.log = originalLog;
    wrappingKeyValue = null;
  });

  it("logs a warning and skips when wrappingKey is missing", async () => {
    wrappingKeyValue = null;
    const initialFolder = baseFolder({ id: "folder-no-wk" });

    render(
      <FolderProvider folderData={initialFolder} tokenData={null} tokenHash={null} isShared={false}>
        <Consumer />
      </FolderProvider>
    );

    // Allow effect turn
    await waitFor(() => {
      expect(true).toBe(true);
    });

    expect(console.warn).toHaveBeenCalledWith("Wrapping key not found, skipping folder key loading");
    expect(mockCreateVault).not.toHaveBeenCalled();
    expect(mockLoadVault).not.toHaveBeenCalled();
    expect(mockUpdateFolderKey).not.toHaveBeenCalled();
  });

  it("creates a new key when folder has no key, then updates server and sets base64 values", async () => {
    // Provide a mock wrapping key
    wrappingKeyValue = {} as CryptoKey;

    // Mock createVault to return binary data (ArrayBuffers/Uint8Array)
    const returnedKey: CryptoKey = {} as CryptoKey;
    const encryptedKey = new Uint8Array([1, 2, 3, 4]).buffer; // ArrayBuffer
    const iv = new Uint8Array([5, 6, 7, 8]); // Uint8Array
    mockCreateVault.mockResolvedValueOnce({ key: returnedKey, encryptedKey, iv });

    // Make updateFolderKey resolve with success
    mockUpdateFolderKey.mockResolvedValueOnce({ error: null });

    const initialFolder = baseFolder({ id: "folder-create", key: undefined, iv: undefined });

    render(
      <FolderProvider folderData={initialFolder} tokenData={null} tokenHash={null} isShared={false}>
        <Consumer />
      </FolderProvider>
    );

    // Wait until folder.key/iv are populated (effect completes createVault path, then re-renders)
    await waitFor(() => {
      const keyText = screen.getByTestId("folder-key").textContent || "";
      const ivText = screen.getByTestId("folder-iv").textContent || "";
      expect(keyText.length).toBeGreaterThan(0);
      expect(ivText.length).toBeGreaterThan(0);
    });

    // Validate calls and base64 conversion
    expect(mockCreateVault).toHaveBeenCalledWith("folder-create", wrappingKeyValue);

    const expectedKeyB64 = Buffer.from(new Uint8Array(encryptedKey)).toString("base64");
    const expectedIvB64 = Buffer.from(iv).toString("base64");

    expect(screen.getByTestId("folder-key").textContent).toBe(expectedKeyB64);
    expect(screen.getByTestId("folder-iv").textContent).toBe(expectedIvB64);

    expect(mockUpdateFolderKey).toHaveBeenCalledWith("folder-create", expectedKeyB64, expectedIvB64);

    // On second effect pass (now key present), it should loadVault
    // Prepare loadVault resolve to avoid unhandled promise
    mockLoadVault.mockResolvedValueOnce({} as CryptoKey);
    await waitFor(() => {
      expect(mockLoadVault).toHaveBeenCalledTimes(1);
    });
  });

  it("logs error when updateFolderKey returns an error", async () => {
    wrappingKeyValue = {} as CryptoKey;
    const returnedKey: CryptoKey = {} as CryptoKey;
    const encryptedKey = new Uint8Array([9, 9, 9]).buffer;
    const iv = new Uint8Array([8, 8, 8]);

    mockCreateVault.mockResolvedValueOnce({ key: returnedKey, encryptedKey, iv });
    mockUpdateFolderKey.mockResolvedValueOnce({ error: new Error("boom") });

    const initialFolder = baseFolder({ id: "folder-error" });

    render(
      <FolderProvider folderData={initialFolder} tokenData={null} tokenHash={null} isShared={false}>
        <Consumer />
      </FolderProvider>
    );

    await waitFor(() => {
      const keyText = screen.getByTestId("folder-key").textContent || "";
      expect(keyText.length).toBeGreaterThan(0);
    });

    expect(console.error).toHaveBeenCalledWith("Error updating folder key", expect.any(Error));
  });

  it("loads an existing key when folder.key and folder.iv are provided", async () => {
    wrappingKeyValue = {} as CryptoKey;

    const existingEnc = Uint8Array.from([10, 11, 12]);
    const existingIv = Uint8Array.from([13, 14, 15, 16]);
    const keyB64 = Buffer.from(existingEnc).toString("base64");
    const ivB64 = Buffer.from(existingIv).toString("base64");

    mockLoadVault.mockResolvedValueOnce({} as CryptoKey);

    const initialFolder = baseFolder({ id: "folder-load", key: keyB64, iv: ivB64 });

    render(
      <FolderProvider folderData={initialFolder} tokenData={null} tokenHash={null} isShared={false}>
        <Consumer />
      </FolderProvider>
    );

    await waitFor(() => {
      expect(mockLoadVault).toHaveBeenCalledTimes(1);
    });

    // Validate parameters to loadVault
    const [bufArg, ivArg, wkArg] = mockLoadVault.mock.calls[0];
    expect(bufArg).toBeInstanceOf(ArrayBuffer);
    expect(ivArg).toBeInstanceOf(Uint8Array);
    expect(wkArg).toBe(wrappingKeyValue);

    // Ensure create path was NOT used
    expect(mockCreateVault).not.toHaveBeenCalled();
    expect(mockUpdateFolderKey).not.toHaveBeenCalled();

    // Context still exposes provided folder values
    expect(screen.getByTestId("folder-key").textContent).toBe(keyB64);
    expect(screen.getByTestId("folder-iv").textContent).toBe(ivB64);
  });
});