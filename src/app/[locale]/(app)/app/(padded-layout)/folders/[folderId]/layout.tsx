import BreadcrumbPortal from "@/components/layout/BreadcrumbPortal";
import HeaderBreadcumb from "@/components/layout/HeaderBreadcumb";
import { FolderService } from "@/data/folder-service";
import { notFound } from "next/navigation";

export default async function FolderLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ folderId: string; locale: string }>;
}) {
    const { folderId } = await params;

    const folder = await FolderService.get({
        where: { id: folderId },
        select: { name: true },
    });

    if (!folder) {
        return notFound();
    }

    return (
        <>
            <BreadcrumbPortal>
                <HeaderBreadcumb folderName={folder.name} />
            </BreadcrumbPortal>
            {children}
        </>
    );
}
