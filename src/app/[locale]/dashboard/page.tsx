import {prisma} from "@/lib/prisma";
import DashboardContent from "@/components/layout/DashboardContent";

export default async function Home({ params }: { params: { locale: string } }) {

    const lastFolders = await prisma.folder.findMany({
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
    const lastImages = await prisma.image.findMany({
        orderBy: [
            {
                updatedAt: 'desc',
            },
        ] as any,
        include: {
            folder: true,
        },
        take: 6,
    });

    return (
        <DashboardContent lastFolders={lastFolders} lastImages={lastImages} locale={params.locale} />
    );
}
