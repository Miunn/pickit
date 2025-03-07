"use server"

import { FolderContent } from "@/components/folders/FolderContent";
import { getFolderFull } from "@/actions/folders";
import { getCurrentSession } from "@/lib/authUtils";
import UnlockTokenPrompt from "@/components/folders/UnlockTokenPrompt";
import { ArrowRight, FolderSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSortedFolderContent } from "@/lib/utils";
import { ImagesSortMethod } from "@/components/folders/SortImages";
import { FolderWithAccessToken, FolderWithCreatedBy, FolderWithImagesWithFolderAndComments } from "@/lib/definitions";

export default async function FolderPage({ params, searchParams }: { params: { folderId: string, locale: string }, searchParams: { sort?: ImagesSortMethod, share?: string, t?: string, h?: string } }) {

    const { session } = await getCurrentSession();
    const folderData = (await getFolderFull(params.folderId, searchParams.share, searchParams.t === "p" ? "personAccessToken" : "accessToken", searchParams.h));

    return (
        <>
            {folderData.folder
                ? <FolderContent folder={getSortedFolderContent(folderData.folder, searchParams.sort || ImagesSortMethod.DateDesc) as FolderWithCreatedBy & FolderWithImagesWithFolderAndComments & FolderWithAccessToken} isGuest={!session} />
                : null
            }
            {folderData.error === "code-needed" || folderData.error === "unauthorized"
                ? <UnlockTokenPrompt folderId={params.folderId} />
                : null
            }
            {folderData.error === "invalid-token"
                ? <div className="mt-[10%] flex flex-col items-center">
                    <FolderSearch className="w-28 h-28 text-red-500" />
                    <h3 className="text-3xl text-center mb-3 text-red-600">Invalid or expired share token</h3>
                    <p className="text-center">We can't find the supplied token for this folder.<br />Perhaps it has expired or is invalid.</p>
                    <Button variant={"link"}>Go to sign in <ArrowRight /></Button>
                </div>
                : null
            }
        </>
    )
}
