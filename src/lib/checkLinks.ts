"use server"

export async function isValidShareLink(folderId?: string, shareToken?: string | null, type?: string | null): Promise<boolean> {
    if (!folderId || !shareToken) {
        return false;
    }

    const r = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/folders/${folderId}/validate-share?share=${shareToken}&t=${type}`);

    if (!r.ok) {
        return false;
    }

    const tokenResponse = await r.json();

    return tokenResponse.result === "valid-token";
}