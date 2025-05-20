import FilesMap from '@/components/map/FilesMap';
import { redirect } from '@/i18n/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/session';

export default async function MapPage({ params }: { params: { locale: string } }) {

    const { user } = await getCurrentSession();

    if (!user) {
        return redirect({ href: "/signin", locale: params.locale });
    }

    const filesWithFolders = await prisma.file.findMany({
        where: { createdBy: { id: user.id } },
        include: { folder: true }
    });

    return (
        <FilesMap filesWithFolders={filesWithFolders} />
    )
}