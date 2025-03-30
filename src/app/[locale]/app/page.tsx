import {prisma} from "@/lib/prisma";
import DashboardContent from "@/components/layout/DashboardContent";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "@/i18n/routing";

export default async function Home() {

    const { user } = await getCurrentSession();

    if (!user) {
        return redirect("/signin");
    }

    const lastFolders = await prisma.folder.findMany({
        where: {
            createdBy: { id: user.id }
        },
        orderBy: [
            {
                updatedAt: 'desc',
            },
        ] as any,
        include: {
            cover: true,
            AccessToken: true,
            _count: {
                select: { images: true }
            },
        },
        take: 6,
    });
    const lastFiles = (await prisma.image.findMany({
        where: {
            createdBy: { id: user.id }
        },
        orderBy: [
            { updatedAt: 'desc' },
        ] as any,
        include: { folder: true, comments: { include: { createdBy: true } } },
        take: 6,
    })).concat(
        await prisma.video.findMany({
            where: {
                createdBy: { id: user.id }
            },
            orderBy: [
                { updatedAt: 'desc' },
            ] as any,
            include: { folder: true, comments: { include: { createdBy: true } } },
            take: 6,
        })
    ).sort((a, b) => {
        return (b.updatedAt as Date).getTime() - (a.updatedAt as Date).getTime();
    }).slice(0, 6);

    return (
        <DashboardContent lastFolders={lastFolders} lastFiles={lastFiles} />
    );
}
