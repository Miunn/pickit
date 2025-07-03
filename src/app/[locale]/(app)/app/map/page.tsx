import FilesMap from '@/components/map/FilesMap';
import { redirect } from '@/i18n/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentSession } from '@/lib/session';
import { generateV4DownloadUrl } from '@/lib/bucket';
import { canAccessMap } from '@/lib/dal';
import { FilesProvider } from '@/context/FilesContext';
import { TokenProvider } from '@/context/TokenContext';
import { ViewState } from '@/components/folders/ViewSelector';

export default async function MapPage(
    props: { params: Promise<{ locale: string }>, searchParams: Promise<{ share?: string, h?: string, t?: string }> }
) {
    const searchParams = await props.searchParams;
    const params = await props.params;

    const { user } = await getCurrentSession();

    if (!(await canAccessMap(searchParams.share, searchParams.h))) {
        if (user) {
            // Surely have a residual access token in URL, this clears it
            return redirect({ href: "/app/map", locale: params.locale });
        }

        return redirect({ href: "/signin", locale: params.locale });
    }

    let files = [];
    let accessToken = null;
    // Get files from share token
    if (searchParams.share) {
        accessToken = await prisma.accessToken.findUnique({ where: { token: searchParams.share } });

        if (!accessToken) {
            return redirect({ href: "/app/map", locale: params.locale });
        }

        files = await prisma.file.findMany({
            where: { folderId: accessToken.folderId },
            include: {
                comments: { include: { createdBy: true } },
                likes: true,
                folder: { include: { _count: { select: { files: true } }, tags: true } },
                tags: true
            }
        });
    } else if (user) {
        files = await prisma.file.findMany({
            where: { createdBy: { id: user.id } },
            include: {
                comments: { include: { createdBy: true } },
                likes: true,
                folder: { include: { _count: { select: { files: true } }, tags: true } },
                tags: true
            }
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
            <TokenProvider token={accessToken}>
                <FilesProvider filesData={filesWithSignedUrlsAndFolders} defaultView={ViewState.Grid}>
                    <FilesMap />
                </FilesProvider>
            </TokenProvider>
        </div>
    )
}