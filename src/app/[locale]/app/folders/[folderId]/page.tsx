import { FolderContent } from "@/components/folders/FolderContent";
import { getCurrentSession } from "@/lib/session";
import UnlockTokenPrompt from "@/components/folders/UnlockTokenPrompt";
import { getSortedFolderContent } from "@/lib/utils";
import { ImagesSortMethod } from "@/components/folders/SortImages";
import { FolderWithAccessToken, FolderWithCover, FolderWithCreatedBy, FolderWithFilesCount, FolderWithFilesWithFolderAndComments } from "@/lib/definitions";
import { Link, redirect } from "@/i18n/navigation";
import { ViewState } from "@/components/folders/ViewSelector";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { hasFolderOwnerAccess, isAllowedToAccessFolder } from "@/lib/dal";
import BreadcrumbPortal from "@/components/layout/BreadcrumbPortal";
import HeaderBreadcumb from "@/components/layout/HeaderBreadcumb";
import { FolderProvider } from "@/context/FolderContext";

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

export default async function FolderPage({ params, searchParams }: { params: { folderId: string, locale: string }, searchParams: { sort?: ImagesSortMethod, view?: ViewState, share?: string, t?: string, h?: string, codeNeeded?: boolean, wrongPin?: boolean } }) {
    const hasAccess = await isAllowedToAccessFolder(params.folderId, searchParams.share, searchParams.h, searchParams.t);

    if (hasAccess === 0) {
        if (searchParams.share) {
            return redirect({ href: `/links/invalid/${searchParams.share}`, locale: params.locale });
        }

        return redirect({ href: "/signin", locale: params.locale });
    }

    const { session } = await getCurrentSession();
    const folder = await prisma.folder.findUnique({
        where: { id: params.folderId },
        include: {
            files: {
                include: {
                    folder: true,
                    comments: { include: { createdBy: true } }
                },
            },
            createdBy: true,
            AccessToken: true
        }
    });

    let accessToken = null;

    if (searchParams.share && searchParams.t === "p") {
        accessToken = await prisma.personAccessToken.findUnique({
            where: { token: searchParams.share },
            include: { folder: true }
        });
    } else if (searchParams.share) {
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

    return (
        <>
            <BreadcrumbPortal>
                <HeaderBreadcumb folderName={folder.name} />
            </BreadcrumbPortal>
            <FolderProvider
                folderData={getSortedFolderContent(folder, searchParams.sort || ImagesSortMethod.DateDesc) as FolderWithCreatedBy & FolderWithAccessToken & FolderWithFilesCount & FolderWithCover & FolderWithFilesWithFolderAndComments}
                tokenData={accessToken}
            >
                <FolderContent
                    defaultView={searchParams.view}
                    isGuest={!session}
                />
            </FolderProvider>
        </>
    )
}
