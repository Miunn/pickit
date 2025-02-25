"use server"

import { FolderContent } from "@/components/folders/FolderContent";
import { getFolderFull } from "@/actions/folders";
import { getCurrentSession } from "@/lib/authUtils";
import UnlockTokenPrompt from "@/components/folders/UnlockTokenPrompt";

export default async function FolderPage({ params, searchParams }: { params: { folderId: string, locale: string }, searchParams: { share?: string, t?: string, h?: string } }) {

    const { session } = await getCurrentSession();
    const folderData = (await getFolderFull(params.folderId, searchParams.share, searchParams.t === "p" ? "personAccessToken" : "accessToken", searchParams.h));

    return (
        <>
            {folderData.folder
                ? <FolderContent folder={folderData.folder} isGuest={!session} />
                : <UnlockTokenPrompt folderId={params.folderId} shareToken={searchParams.share} tokenType={searchParams.t === "p" ? "p" : "a"} />
            }
        </>
    )
}
