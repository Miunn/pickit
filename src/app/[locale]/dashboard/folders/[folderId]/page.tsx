import { FolderContent } from "@/components/folders/FolderContent";
import { getFolderFull } from "@/actions/folders";
import { auth } from "@/actions/auth";

export default async function FolderPage({ params, searchParams }: { params: { folderId: string, locale: string }, searchParams: { share?: string, t?: string } }) {

    const session = await auth();
    const folder = (await getFolderFull(params.folderId, searchParams.share, searchParams.t === "p" ? "personAccessToken" : "accessToken"));

    return (
        <FolderContent
            folderId={params.folderId}
            folder={folder.folder}
            isGuest={!session?.user}
            locale={params.locale}
        />
    )
}
