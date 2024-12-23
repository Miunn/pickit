"use client"

import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { getFolderName } from "@/actions/actions";
import { Folder } from "@prisma/client";

export default function HeaderBreadcumb() {

    const locale = useLocale();
    const pathname = usePathname();

    const [pathTokens, setPathTokens] = useState<string[]>([]);
    const [pathDashboard, setPathDashboard] = useState<boolean>(false);
    const [pathListFolders, setPathListFolders] = useState<boolean>(false);
    const [pathListImages, setPathListImages] = useState<boolean>(false);
    const [pathFolder, setPathFolder] = useState<{ id: string; name: string; } | null>(null);

    const [pathLinks, setPathLinks] = useState<boolean>(false);

    const getPathFolderName = async (folderId: string) => {
        const folder = await getFolderName(folderId);

        if (folder.folder) {
            setPathFolder(folder.folder);
        }
    }

    useEffect(() => {
        const tokens = pathname.split("/").filter(path => path && !(new RegExp("^(en|fr)$").test(path)));

        setPathTokens(tokens);

        if (tokens[0] === "dashboard" && tokens.length === 1) {
            setPathDashboard(true);

            setPathListFolders(false);
            setPathListImages(false);
            setPathFolder(null);
            setPathLinks(false);
        }

        if (tokens[0] === "dashboard" && tokens[1] === "folders" && tokens.length === 2) {
            setPathListFolders(true);

            setPathDashboard(false);
            setPathListImages(false);
            setPathFolder(null);
            setPathLinks(false);
        }

        if (tokens[0] === "dashboard" && tokens[1] === "images" && tokens.length === 2) {
            setPathListImages(true);

            setPathDashboard(false);
            setPathListFolders(false);
            setPathFolder(null);
            setPathLinks(false);
        }

        if (tokens[0] === "dashboard" && tokens[1] === "folders" && tokens[2]) {
            getPathFolderName(tokens[2]);

            setPathDashboard(false);
            setPathListFolders(false);
            setPathListImages(false);
            setPathLinks(false);
        }

        if (tokens[0] === "dashboard" && tokens[1] === "links" && tokens.length === 2) {
            setPathLinks(true);

            setPathDashboard(false);
            setPathListFolders(false);
            setPathListImages(false);
            setPathFolder(null);
        }
    }, [pathname]);

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {pathDashboard ? (
                    <>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Dashboard</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                ) : (
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href={`/${locale}/dashboard`}>
                            Dashboard
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                )}
                {pathListFolders ? (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Folders</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                ) : null}
                {pathListImages ? (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Images</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                ) : null}
                {pathFolder ? (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/folders">Folders</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{pathFolder.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                ) : null}
                {pathLinks ? (
                    <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Links</BreadcrumbPage>
                    </BreadcrumbItem>
                </>
                ) : null}
            </BreadcrumbList>
        </Breadcrumb>
    )
}