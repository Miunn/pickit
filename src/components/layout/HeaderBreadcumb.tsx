'use client';

import { usePathname } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "../ui/breadcrumb";
import { UserAdministration } from "@/lib/definitions";
import { useTranslations } from "next-intl";

type BreadcrumbType = 'dashboard' | 'folders' | 'images' | 'folder' | 'links' | 'map' | 'account' | 'administration' | 'administrationUsers';

type BreadcrumbPath = {
    type: BreadcrumbType;
    folderId?: string;
    folderName?: string;
    userId?: string;
};

function getCurrentPath(pathname: string, folderName?: string): { path: BreadcrumbPath | null; userId?: string } {
    const tokens = pathname.split("/").filter(path => path && !(new RegExp("^(en|fr)$").test(path)));
    
    if (tokens[0] !== "app") return { path: null };

    const pathMap: Record<string, BreadcrumbPath> = {
        '': { type: 'dashboard' },
        'folders': { type: 'folders' },
        'images': { type: 'images' },
        'links': { type: 'links' },
        'map': { type: 'map' },
        'account': { type: 'account' },
        'administration': { type: 'administration' },
    };

    if (tokens.length === 1) {
        return { path: pathMap[''] };
    } else if (tokens.length === 2) {
        return { path: pathMap[tokens[1]] || null };
    } else if (tokens[1] === 'folders' && tokens[2]) {
        return { path: { type: 'folder', folderId: tokens[2], folderName } };
    } else if (tokens[1] === 'account') {
        return { path: { type: 'account' } };
    } else if (tokens[1] === 'administration' && tokens[2] === 'users' && tokens[3]) {
        return { 
            path: { type: 'administrationUsers', userId: tokens[3] },
            userId: tokens[3]
        };
    }

    return { path: null };
}



export default function HeaderBreadcumb({ folderName, adminUser }: { readonly folderName?: string, readonly adminUser?: UserAdministration }) {
    const pathname = usePathname();
    const t = useTranslations('breadcumb');
    const locale = pathname.split('/')[1] || 'en';

    const { path: currentPath } = getCurrentPath(pathname, folderName);

    const renderBreadcrumbItem = (type: BreadcrumbType, locale: string, isCurrent: boolean = false) => {
        return isCurrent ? (
            <BreadcrumbItem>
                <BreadcrumbPage>{t(type)}</BreadcrumbPage>
            </BreadcrumbItem>
        ) : (
            <BreadcrumbItem className="hidden lg:block">
                <BreadcrumbLink href={`/${locale}/app/${type.toLowerCase() === 'dashboard' ? '' : type.toLowerCase()}`}>
                    {t(type)}
                </BreadcrumbLink>
            </BreadcrumbItem>
        );
    }

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {currentPath && (
                    <>
                        {renderBreadcrumbItem('dashboard', locale, currentPath.type === 'dashboard')}
                        
                        {currentPath.type !== 'dashboard' && (
                            <>
                                <BreadcrumbSeparator className="hidden lg:block" />
                                {currentPath.type === 'folder' ? (
                                    <>
                                        {renderBreadcrumbItem('folders', locale)}
                                        <BreadcrumbSeparator className="hidden md:block" />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>{folderName}</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </>
                                ) : currentPath.type === 'administrationUsers' ? (
                                    <>
                                        {renderBreadcrumbItem('administration', locale)}
                                        <BreadcrumbSeparator className="hidden lg:block" />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>{adminUser?.name}</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </>
                                ) : (
                                    renderBreadcrumbItem(currentPath.type, locale, true)
                                )}
                            </>
                        )}
                    </>
                )}
            </BreadcrumbList>
        </Breadcrumb>
    );
}