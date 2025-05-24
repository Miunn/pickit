import FilesMap from '@/components/map/FilesMap';
import { redirect } from '@/i18n/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/session';
import { generateV4DownloadUrl } from '@/lib/bucket';
import { canAccessMap, getToken } from '@/lib/dal';

export default async function MapPage({ params, searchParams }: { params: { locale: string }, searchParams: { share?: string, h?: string, t?: string } }) {

    const { user } = await getCurrentSession();

    if (!(await canAccessMap(searchParams.share, searchParams.h, searchParams.t === "p" ? "personAccessToken" : "accessToken"))) {
        if (user) {
            // Surely have a residual access token in URL, this clears it
            return redirect({ href: "/app/map", locale: params.locale });
        }

        return redirect({ href: "/signin", locale: params.locale });
    }

    let files = [];
    // Get files from share token
    if (searchParams.share) {
        const token = await getToken(searchParams.share, searchParams.t === "p" ? "personAccessToken" : "accessToken");

        if (!token) {
            return redirect({ href: "/app/map", locale: params.locale });
        }

        files = await prisma.file.findMany({
            where: { folderId: token.folderId },
            include: { folder: { include: { _count: true } } }
        });
    } else if (user) {
        files = await prisma.file.findMany({
            where: { createdBy: { id: user.id } },
            include: { folder: { include: { _count: true } } }
        });
    } else {
        return redirect({ href: "/signin", locale: params.locale });
    }

    const filesWithSignedUrlsAndFolders = await Promise.all(files.map(async (file) => ({
        ...file,
        signedUrl: await generateV4DownloadUrl(`${file.createdById}/${file.folderId}/${file.id}`),
    })));

    return (
        <div className='rounded-b-xl h-full overflow-hidden'>
            <FilesMap filesWithFolders={filesWithSignedUrlsAndFolders} />
        </div>
    )
}