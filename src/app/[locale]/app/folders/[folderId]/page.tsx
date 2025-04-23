import { FolderContent } from "@/components/folders/FolderContent";
import { getFolderFull } from "@/actions/folders";
import { getCurrentSession } from "@/lib/session";
import UnlockTokenPrompt from "@/components/folders/UnlockTokenPrompt";
import { getSortedFolderContent } from "@/lib/utils";
import { ImagesSortMethod } from "@/components/folders/SortImages";
import { FolderWithAccessToken, FolderWithCreatedBy, FolderWithFilesWithFolderAndComments } from "@/lib/definitions";
import { Link, redirect } from "@/i18n/navigation";
import { ViewState } from "@/components/folders/ViewSelector";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params, searchParams }: { params: { folderId: string, locale: string }, searchParams: { sort?: ImagesSortMethod, view?: ViewState, share?: string, t?: string, h?: string } }): Promise<Metadata> {
    const t = await getTranslations("metadata.folder");
    const { user } = await getCurrentSession();
    let folderName: { name: string } | null = null;
    if (!user) {
        if (!searchParams.share) {
            return {
                title: t("title", { folderName: "Folder" }),
                description: t("description", { folderName: "Folder" }),
                openGraph: {
                    title: t("title", { folderName: "Folder" }),
                    description: t("description", { folderName: "Folder" }),
                }
            }
        }

        if (searchParams.t === "p") {
            folderName = await prisma.personAccessToken.findUnique({
                where: { token: searchParams.share },
                select: { folder: { select: { name: true } } }
            }).then(result => result ? { name: result.folder.name } : null);
        } else {
            folderName = await prisma.accessToken.findUnique({
                where: { token: searchParams.share },
                select: { folder: { select: { name: true } } }
            }).then(result => result ? { name: result.folder.name } : null);
        }
    } else {
        folderName = await prisma.folder.findUnique({
            where: { id: params.folderId, createdBy: { id: user.id } },
            select: { name: true }
        });
    }

    if (!folderName) {
        return {
            title: t("title", { folderName: "Folder" }),
            description: t("description", { folderName: "Folder" }),
            openGraph: {
                title: t("openGraph.title", { folderName: "Folder" }),
                description: t("openGraph.description", { folderName: "Folder" }),
            }
        }
    }

    return {
        title: t("title", { folderName: folderName.name }),
        description: t("description", { folderName: folderName.name }),
        openGraph: {
            title: t("openGraph.title", { folderName: folderName.name }),
            description: t("openGraph.description", { folderName: folderName.name }),
        }
    }
}

export default async function FolderPage({ params, searchParams }: { params: { folderId: string, locale: string }, searchParams: { sort?: ImagesSortMethod, view?: ViewState, share?: string, t?: string, h?: string } }) {

    const { session } = await getCurrentSession();
    const folderData = (await getFolderFull(params.folderId, searchParams.share, searchParams.t === "p" ? "personAccessToken" : "accessToken", searchParams.h));

    if (folderData.error === "unauthorized") {
        return redirect({ href: "/signin", locale: params.locale });
    }

    if (folderData.error === "invalid-token") {
        return redirect({ href: `/links/invalid/${searchParams.share}`, locale: params.locale });
    }

    if (searchParams.share) {
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tokens/increment?token=${searchParams.share}`)
    }


    return (
        <>
            {folderData.folder
                ? <FolderContent
                    folder={getSortedFolderContent(folderData.folder, searchParams.sort || ImagesSortMethod.DateDesc) as FolderWithFilesWithFolderAndComments & FolderWithAccessToken & FolderWithCreatedBy}
                    defaultView={searchParams.view}
                    isGuest={!session}
                />
                : null
            }
            {folderData.error === "code-needed" || folderData.error === "wrong-pin"
                ? <UnlockTokenPrompt folderId={params.folderId} wrongPin={folderData.error === "wrong-pin"} />
                : null
            }
        </>
    )
}
