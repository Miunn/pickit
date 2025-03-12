"use client"

import DeleteFolderDialog from "@/components/folders/DeleteFolderDialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatBytes } from "@/lib/utils";
import { FolderX, MoreHorizontal } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export default function ReviewFolders({ locale, folders }: { locale: string, folders: { id: string, name: string, size: number, createdAt: Date, _count: { images: number } }[] }) {

    const intlFormatter = useFormatter();
    const t = useTranslations("components.account.reviewFolders");
    const deleteFolderTranslations = useTranslations("dialogs.folders.delete");
    const [openDeleteFolderDialog, setOpenDeleteFolderDialog] = useState<boolean>(false);
    const [selectedFolder, setSelectedFolder] = useState<{ id: string, name: string } | null>(null);

    return (
        <div className="h-full overflow-y-hidden">
            <h3 className="font-semibold">{t('title')}</h3>

            <ScrollArea className="mt-6 h-full overflow-y-auto">
                {folders.length === 0
                    ? <div className={"flex flex-col justify-center items-center"}>
                        <FolderX className={"w-32 h-32 opacity-20"} />
                        <p>{t('empty')}</p>
                    </div>
                    : null
                }
                {folders.map((folder) => (
                    <div key={folder.id} className="flex items-center justify-between py-2 border-b border-gray-200 pr-px">
                        <div>
                            <h4 className="font-semibold truncate">{folder.name}</h4>
                            <p className="text-sm text-muted-foreground capitalize">{intlFormatter.dateTime(folder.createdAt, { weekday: "long", day: "numeric", year: "numeric", month: "long" })}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-sm text-muted-foreground">{t('folder.images', { count: folder._count.images })}</p>
                            <p className="text-sm text-muted-foreground">{formatBytes(folder.size)}</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">{t('folder.dropdown.fallback')}</span>
                                        <MoreHorizontal />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-40">
                                    <DropdownMenuLabel>{t('folder.dropdown.label')}</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/${locale}/app/folders/${folder.id}`} className="cursor-default">
                                            {t('folder.dropdown.openFolder')}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/${locale}/app/links`} className="cursor-default">
                                            {t('folder.dropdown.manageAccesses')}
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 font-semibold" onClick={() => {
                                        setSelectedFolder(folder);
                                        setOpenDeleteFolderDialog(true);
                                    }}>{deleteFolderTranslations('trigger')}</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </ScrollArea>
            <DeleteFolderDialog
                openState={openDeleteFolderDialog}
                setOpenState={setOpenDeleteFolderDialog}
                folderId={selectedFolder?.id || ""}
                folderName={selectedFolder?.name || ""}
            />
        </div>
    )
}