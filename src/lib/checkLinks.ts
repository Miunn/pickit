"use server"

export async function isValidShareLink(folderId?: string, shareToken?: string | null): Promise<boolean> {
    if (!folderId || !shareToken) {
        return false;
    }

    const r = await fetch(`${process.env.NEXTAUTH_URL}/api/folders/${folderId}/validate-share?share=${shareToken}`);

    if (!r.ok) {
        return false;
    }

    const tokenResponse = await r.json();

    return tokenResponse.result === "valid-token";
}