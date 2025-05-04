import {prisma} from "@/lib/prisma";
import DashboardContent from "@/components/layout/DashboardContent";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "@/i18n/navigation";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const t = await getTranslations("metadata.dashboard")
    return {
        title: t("title"),
        description: t("description"),
    }
}

export default async function Home({ params }: { params: { locale: string } }) {

    const { user } = await getCurrentSession();

    if (!user) {
        return redirect({ href: "/signin", locale: params.locale });
    }

    const lastFolders = await prisma.folder.findMany({
        where: {
            createdBy: { id: user.id }
        },
        orderBy: [ { updatedAt: 'desc' } ],
        include: {
            cover: true,
            AccessToken: true,
            files: { include: { folder: true, comments: { include: { createdBy: true } } } },
            _count: { select: { files: true } },
        },
        take: 6,
    });
    const lastFiles = (await prisma.file.findMany({
        where: {
            createdBy: { id: user.id }
        },
        orderBy: [ { updatedAt: 'desc' } ],
        include: { folder: true, comments: { include: { createdBy: true } } },
        take: 6,
    })).sort((a, b) => {
        return (b.updatedAt as Date).getTime() - (a.updatedAt as Date).getTime();
    }).slice(0, 6);

    return (
        <DashboardContent lastFolders={lastFolders} lastFiles={lastFiles} />
    );
}
