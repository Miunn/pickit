"use client"

import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getFolderName } from "@/actions/folders";
import { UserAdministration } from "@/lib/definitions";
import { getUser } from "@/actions/userAdministration";

export default function HeaderBreadcumb() {

    const locale = useLocale();
    const pathname = usePathname();
    const t = useTranslations('breadcumb');

    const [pathDashboard, setPathDashboard] = useState<boolean>(false);
    const [pathListFolders, setPathListFolders] = useState<boolean>(false);
    const [pathListImages, setPathListImages] = useState<boolean>(false);
    const [pathFolder, setPathFolder] = useState<{ id: string; name: string; } | null>(null);
    const [pathLinks, setPathLinks] = useState<boolean>(false);

    const [pathAccount, setPathAccount] = useState<boolean>(false);

    const [pathAdministration, setPathAdministration] = useState<boolean>(false);
    const [pathAdministrationUsers, setPathAdministrationUsers] = useState<boolean>(false);

    const [adminUser, setAdminUser] = useState<UserAdministration | null>(null);

    const getPathFolderName = async (folderId: string) => {
        const folder = await getFolderName(folderId);

        if (folder.folder) {
            setPathFolder(folder.folder);
        }
    }

    useEffect(() => {
        const tokens = pathname.split("/").filter(path => path && !(new RegExp("^(en|fr)$").test(path)));

        if (tokens[0] === "dashboard" && tokens.length === 1) {
            setPathDashboard(true);

            setPathListFolders(false);
            setPathListImages(false);
            setPathFolder(null);
            setPathLinks(false);
            setPathAccount(false);
            setPathAdministration(false);
            setPathAdministrationUsers(false);
        }

        if (tokens[0] === "dashboard" && tokens[1] === "folders" && tokens.length === 2) {
            setPathListFolders(true);

            setPathDashboard(false);
            setPathListImages(false);
            setPathFolder(null);
            setPathLinks(false);
            setPathAccount(false);
            setPathAdministration(false);
            setPathAdministrationUsers(false);
        }

        if (tokens[0] === "dashboard" && tokens[1] === "images" && tokens.length === 2) {
            setPathListImages(true);

            setPathDashboard(false);
            setPathListFolders(false);
            setPathFolder(null);
            setPathLinks(false);
            setPathAccount(false);
            setPathAdministration(false);
            setPathAdministrationUsers(false);
        }

        if (tokens[0] === "dashboard" && tokens[1] === "folders" && tokens[2]) {
            getPathFolderName(tokens[2]);

            setPathDashboard(false);
            setPathListFolders(false);
            setPathListImages(false);
            setPathLinks(false);
            setPathAccount(false);
            setPathAdministration(false);
            setPathAdministrationUsers(false);
        }

        if (tokens[0] === "dashboard" && tokens[1] === "links" && tokens.length === 2) {
            setPathLinks(true);

            setPathDashboard(false);
            setPathListFolders(false);
            setPathListImages(false);
            setPathFolder(null);
            setPathAccount(false);
            setPathAdministration(false);
            setPathAdministrationUsers(false);
        }

        if (tokens[0] === "dashboard" && tokens[1] === "account" && tokens.length === 2) {
            setPathAccount(true);

            setPathDashboard(false);
            setPathListFolders(false);
            setPathListImages(false);
            setPathFolder(null);
            setPathLinks(false);
            setPathAdministration(false);
            setPathAdministrationUsers(false);
        }

        if (tokens[0] === "dashboard" && tokens[1] === "admin" && tokens.length === 2) {
            setPathAdministration(true);

            setPathDashboard(false);
            setPathListFolders(false);
            setPathListImages(false);
            setPathFolder(null);
            setPathLinks(false);
            setPathAccount(false);
            setPathAdministrationUsers(false);
        }

        if (tokens[0] === "dashboard" && tokens[1] === "admin" && tokens[2] === "users" && tokens.length === 4) {
            getUser(tokens[3]).then((r) => {
                if (r.error) {
                    return
                }

                setAdminUser(r.user)
            });
            setPathAdministrationUsers(true);

            setPathDashboard(false);
            setPathListFolders(false);
            setPathListImages(false);
            setPathFolder(null);
            setPathLinks(false);
            setPathAccount(false);
            setPathAdministration(false);
        }
    }, [pathname]);

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {pathDashboard ? (
                    <>
                        <BreadcrumbItem>
                            <BreadcrumbPage>{t('dashboard')}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                ) : (
                    <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href={`/${locale}/dashboard`}>
                            {t('dashboard')}
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                )}
                {pathListFolders ? (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{t('folders')}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                ) : null}
                {pathListImages ? (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{t('images')}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                ) : null}
                {pathFolder ? (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/folders">{t('folders')}</BreadcrumbLink>
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
                            <BreadcrumbPage>{t('links')}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                ) : null}
                {pathAccount ? (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{t('account')}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                ) : null}

                {pathAdministration ? (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{t('administration')}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                ) : null}

                {pathAdministrationUsers ? (
                    <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/admin">
                                {t('administration')}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbList>{t('administrationUsers')}</BreadcrumbList>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{ adminUser?.name }</BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                ) : null}
            </BreadcrumbList>
        </Breadcrumb>
    )
}