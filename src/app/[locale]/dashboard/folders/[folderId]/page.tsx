import { FolderContent } from "@/components/folders/FolderContent";
import { getFolderFull } from "@/actions/folders";

export default async function FolderPage({ params, searchParams }: { params: { folderId: string, locale: string }, searchParams: { share?: string, t?: string } }) {

    const folder = (await getFolderFull(params.folderId, searchParams.share, searchParams.t === "p" ? "personAccessToken" : "accessToken"));

    return (
        <FolderContent folderId={params.folderId} folder={folder.folder} shareToken={searchParams.share} locale={params.locale} />
    )   
}
