import { FolderContent } from "@/components/folders/FolderContent";
import { getCurrentSession } from "@/lib/session";
import UnlockTokenPrompt from "@/components/folders/UnlockTokenPrompt";
import { getSortedFolderContent } from "@/lib/utils";
import { ImagesSortMethod } from "@/components/folders/SortImages";
import { FolderWithAccessToken, FolderWithCover, FolderWithCreatedBy, FolderWithFilesCount, FolderWithFilesWithFolderAndComments } from "@/lib/definitions";
import { redirect } from "@/i18n/navigation";
import { ViewState } from "@/components/folders/ViewSelector";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isAllowedToAccessFolder } from "@/lib/dal";
import BreadcrumbPortal from "@/components/layout/BreadcrumbPortal";
import HeaderBreadcumb from "@/components/layout/HeaderBreadcumb";
import { FolderProvider } from "@/context/FolderContext";
import { FilesProvider } from "@/context/FilesContext";
import { TokenProvider } from "@/context/TokenContext";
import { generateV4DownloadUrl } from "@/lib/bucket";

export async function generateMetadata(
    props: { params: Promise<{ folderId: string, locale: string }>, searchParams: Promise<{ sort?: ImagesSortMethod, view?: ViewState, share?: string, h?: string }> }
): Promise<Metadata> {
    const searchParams = await props.searchParams;
    const params = await props.params;
    const t = await getTranslations("metadata.folder");
    let folderNameAndDescription: { name: string, description?: string | null } | null = null;
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

    folderNameAndDescription = await prisma.accessToken.findUnique({
        where: { token: searchParams.share },
        select: { folder: { select: { name: true, description: true } } }
    }).then(result => result ? { name: result.folder.name, description: result.folder.description } : null);

    if (!folderNameAndDescription) {
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
        title: t("title", { folderName: folderNameAndDescription.name }),
        description: folderNameAndDescription.description ? folderNameAndDescription.description : t("description", { folderName: folderNameAndDescription.name }),
        openGraph: {
            title: t("openGraph.title", { folderName: folderNameAndDescription.name }),
            description: folderNameAndDescription.description ? folderNameAndDescription.description : t("openGraph.description", { folderName: folderNameAndDescription.name }),
            images: [
                {
                    alt: "Echomori",
                    url: `${process.env.NEXT_PUBLIC_APP_URL}/api/folders/${params.folderId}/og?${searchParams.share ? `share=${searchParams.share}` : ""}&${searchParams.h ? `h=${searchParams.h}` : ""}`,
                    type: "image/png",
                    width: 1200,
                    height: 630
                }
            ]
        }
    }
}

export default async function FolderPage(
    props: { params: Promise<{ folderId: string, locale: string }>, searchParams: Promise<{ sort?: ImagesSortMethod, view?: ViewState, share?: string, t?: string, h?: string, codeNeeded?: boolean, wrongPin?: boolean }> }
) {
    const searchParams = await props.searchParams;
    const params = await props.params;
    const hasAccess = await isAllowedToAccessFolder(params.folderId, searchParams.share, searchParams.h, searchParams.t);

    if (hasAccess === 0) {
        if (searchParams.share) {
            return redirect({ href: `/links/invalid/${searchParams.share}`, locale: params.locale });
        }

        return redirect({ href: "/signin", locale: params.locale });
    }

    const folder = await prisma.folder.findUnique({
        where: { id: params.folderId },
        include: {
            files: {
                include: {
                    folder: { include: { _count: { select: { files: true } }, tags: true } },
                    comments: { include: { createdBy: true } },
                    likes: true,
                    tags: true
                },
            },
            createdBy: true,
            accessTokens: true
        }
    });

    let accessToken = null;

    if (searchParams.share) {
        accessToken = await prisma.accessToken.findUnique({
            where: { token: searchParams.share },
            include: { folder: true }
        });
    }

    if (hasAccess === 2 || hasAccess === 3) {
        if (!accessToken) {
            return redirect({ href: `/links/invalid/${searchParams.share}`, locale: params.locale });
        }

        return (
            <>
                <BreadcrumbPortal>
                    <HeaderBreadcumb folderName={accessToken.folder.name} />
                </BreadcrumbPortal>
                <UnlockTokenPrompt folderId={params.folderId} wrongPin={hasAccess === 3} />
            </>
        )
    }

    if (!folder) {
        return redirect({ href: "/folders", locale: params.locale });
    }

    if (searchParams.share) {
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/tokens/increment?token=${searchParams.share}`)
    }

    const filesWithSignedUrls = await Promise.all(folder.files.map(async (file) => ({
        ...file,
        signedUrl: await generateV4DownloadUrl(`${file.createdById}/${file.folderId}/${file.id}`),
    })));

    return (
        <>
            <BreadcrumbPortal>
                <HeaderBreadcumb folderName={folder.name} />
            </BreadcrumbPortal>
            <FolderProvider
                folderData={getSortedFolderContent(folder, searchParams.sort || ImagesSortMethod.DateDesc) as FolderWithCreatedBy & FolderWithAccessToken & FolderWithFilesCount & FolderWithCover & FolderWithFilesWithFolderAndComments}
                tokenData={accessToken}
                tokenHash={searchParams.h ?? null}
                isShared={folder.accessTokens.filter(token => token.email).length > 0}
            >
                <TokenProvider token={accessToken}>
                    <FilesProvider filesData={filesWithSignedUrls} defaultView={searchParams.view || ViewState.Grid}>
                        <FolderContent />
                    </FilesProvider>
                </TokenProvider>
            </FolderProvider>
        </>
    )
}
