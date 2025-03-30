import { FolderContent } from "@/components/folders/FolderContent";
import { getFolderFull } from "@/actions/folders";
import { getCurrentSession } from "@/lib/session";
import UnlockTokenPrompt from "@/components/folders/UnlockTokenPrompt";
import { ArrowRight, FolderSearch, View } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSortedFolderContent } from "@/lib/utils";
import { ImagesSortMethod } from "@/components/folders/SortImages";
import { FolderWithAccessToken, FolderWithCreatedBy, FolderWithImagesWithFolderAndComments, FolderWithVideosWithFolderAndComments } from "@/lib/definitions";
import { redirect } from "@/i18n/routing";
import { ViewState } from "@/components/folders/ViewSelector";

export default async function FolderPage({ params, searchParams }: { params: { folderId: string, locale: string }, searchParams: { sort?: ImagesSortMethod, view?: ViewState, share?: string, t?: string, h?: string } }) {

    const { session } = await getCurrentSession();
    const folderData = (await getFolderFull(params.folderId, searchParams.share, searchParams.t === "p" ? "personAccessToken" : "accessToken", searchParams.h));

    if (folderData.error === "unauthorized") {
        return redirect("/signin");
    }

    return (
        <>
            {folderData.folder
                ? <FolderContent
                    folder={getSortedFolderContent(folderData.folder, searchParams.sort || ImagesSortMethod.DateDesc) as FolderWithImagesWithFolderAndComments & FolderWithVideosWithFolderAndComments & FolderWithAccessToken & FolderWithCreatedBy}
                    defaultView={searchParams.view}
                    isGuest={!session}
                />
                : null
            }
            {folderData.error === "code-needed" || folderData.error === "wrong-pin"
                ? <UnlockTokenPrompt folderId={params.folderId} wrongPin={folderData.error === "wrong-pin"} />
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
