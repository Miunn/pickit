import FilesMap from '@/components/map/FilesMap';
import { redirect } from '@/i18n/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/session';
import { generateV4DownloadUrl } from '@/lib/bucket';

export default async function MapPage({ params }: { params: { locale: string } }) {

    const { user } = await getCurrentSession();

    if (!user) {
        return redirect({ href: "/signin", locale: params.locale });
    }

    const filesWithFolders = await prisma.file.findMany({
        where: { createdBy: { id: user.id } },
        include: { folder: true }
    });

    const filesWithSignedUrlsAndFolders = await Promise.all(filesWithFolders.map(async (file) => ({
        ...file,
        signedUrl: await generateV4DownloadUrl(`${file.createdById}/${file.folderId}/${file.id}`),
    })));

    return (
        <div className='rounded-b-xl h-full overflow-hidden'>
            <FilesMap filesWithFolders={filesWithSignedUrlsAndFolders} />
        </div>
    )
}