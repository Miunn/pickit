"use server"

import { FolderContent } from "@/components/folders/FolderContent";
import { getFolderFull } from "@/actions/folders";
import { getCurrentSession } from "@/lib/authUtils";
import UnlockTokenPrompt from "@/components/folders/UnlockTokenPrompt";
import { FolderSearch } from "lucide-react";

export default async function FolderPage({ params, searchParams }: { params: { folderId: string, locale: string }, searchParams: { share?: string, t?: string, h?: string } }) {

    const { session } = await getCurrentSession();
    const folderData = (await getFolderFull(params.folderId, searchParams.share, searchParams.t === "p" ? "personAccessToken" : "accessToken", searchParams.h));

    return (
        <>
            {folderData.folder
                ? <FolderContent folder={folderData.folder} isGuest={!session} />
                : null
            }
            {folderData.error === "code-needed" || folderData.error === "unauthorized"
                ? <UnlockTokenPrompt folderId={params.folderId} shareToken={searchParams.share} tokenType={searchParams.t === "p" ? "p" : "a"} />
                : null
            }
            {folderData.error === "invalid-token"
                ? <div className="mt-[10%] flex flex-col items-center">
                    <FolderSearch className="w-28 h-28 text-red-500" />
                    <h3 className="text-3xl text-center mb-3 text-red-600">Invalid or expired share token</h3>
                    <p className="text-center">We can't find the supplied token for this folder.<br />Perhaps it has expired or is invalid.</p>
                </div>
                : null
            }
        </>
    )
}
