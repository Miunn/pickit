import { prisma } from "@/lib/prisma";
import DashboardContent from "@/components/layout/DashboardContent";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "@/i18n/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FilesProvider } from "@/context/FilesContext";
import { TokenProvider } from "@/context/TokenContext";
import { generateV4DownloadUrl } from "@/lib/bucket";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("metadata.dashboard")
    return {
        title: t("title"),
        description: t("description"),
    }
}

export default async function Home(props: { params: Promise<{ locale: string }> }) {
    const params = await props.params;

    const { user } = await getCurrentSession();

    if (!user) {
        return redirect({ href: "/signin", locale: params.locale });
    }

    const lastFolders = await prisma.folder.findMany({
        where: {
            createdBy: { id: user.id }
        },
        orderBy: [{ updatedAt: 'desc' }],
        include: {
            cover: true,
            AccessToken: true,
            files: { include: { folder: { include: { _count: { select: { files: true } } } }, comments: { include: { createdBy: true } } } },
            _count: { select: { files: true } },
        },
        take: 6,
    });
    const lastFiles = (await prisma.file.findMany({
        where: {
            createdBy: { id: user.id }
        },
        orderBy: [{ updatedAt: 'desc' }],
        include: { folder: { include: { _count: { select: { files: true } } } }, comments: { include: { createdBy: true } }, likes: true, tags: true },
        take: 6,
    })).sort((a, b) => {
        return (b.updatedAt as Date).getTime() - (a.updatedAt as Date).getTime();
    }).slice(0, 6);

    const lastFilesWithSignedUrls = await Promise.all(lastFiles.map(async (file) => ({
        ...file,
        signedUrl: await generateV4DownloadUrl(`${file.createdById}/${file.folderId}/${file.id}`),
    })));

    return (
        <TokenProvider token={null}>
            <FilesProvider filesData={lastFilesWithSignedUrls}>
                <DashboardContent lastFolders={lastFolders} />
            </FilesProvider>
        </TokenProvider>
    );
}
