"use client"

import { changeAccessTokenActiveState, changeAccessTokenAllowMap, sendAgainAccessToken, unlockAccessToken } from "@/actions/accessTokens";
import DeleteAccessTokenDialog from "@/components/accessTokens/DeleteAccessTokenDialog";
import LockTokenDialog from "@/components/folders/LockTokenDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { Link } from "@/i18n/navigation";
import { AccessTokenWithFolder } from "@/lib/definitions"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, BadgeCheck, BadgeMinus, CircleHelp, Eye, Lock, LockOpen, MapPin, MapPinOff, MoreHorizontal, Pencil, PencilOff } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

// Define the permission values as constants
const PERMISSIONS = {
    READ: 'READ' as const,
    WRITE: 'WRITE' as const,
    ADMIN: 'ADMIN' as const,
} as const;

export const personColumns: ColumnDef<AccessTokenWithFolder>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50
    },
    {
        id: "folder_name",
        accessorKey: "folder.name",
        header: ({ column }) => {
            const t = useTranslations("dataTables.people.columns")
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t("name.header")}
                    <ArrowUpDown className="w-4 h-4 ml-2" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const name: string = row.getValue("folder_name");
            return <p className="font-semibold truncate">{name}</p>
        }
    },
    {
        accessorKey: "email",
        header: () => {
            const t = useTranslations("dataTables.people.columns");

            return (
                <p>{t('email.header')}</p>
            )
        },
        size: 340
    },
    {
        accessorKey: "permission",
        header: () => {
            const t = useTranslations("dataTables.people.columns.permission");
            return <p>{t('header')}</p>
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.people.columns.permission");
            const permission: string = row.getValue("permission");
            if (permission === PERMISSIONS.READ) {
                return <Badge className="bg-blue-600 hover:bg-blue-700 flex gap-2 w-fit"><PencilOff /> {t('read')}</Badge>
            }
            if (permission === PERMISSIONS.WRITE) {
                return <Badge className="bg-green-600 hover:bg-green-700 flex gap-2 w-fit"><Pencil /> {t('write')}</Badge>
            }
            if (permission === PERMISSIONS.ADMIN) {
                return <Badge className="bg-purple-600 hover:bg-purple-700 flex gap-2 w-fit"><BadgeCheck /> {t('admin')}</Badge>
            }
            return <Badge className="bg-gray-600 hover:bg-gray-700 flex gap-2 w-fit"><BadgeMinus /> {t('none')}</Badge>
        },
        size: 260
    },
    {
        accessorKey: "isActive",
        header: () => {
            const t = useTranslations("dataTables.people.columns.active");

            return (
                <p className="flex gap-2 items-center">
                    {t('header')}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                            <CircleHelp className="w-4 h-4 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p  dangerouslySetInnerHTML={{__html: t('tooltip')}} />
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.people.columns.active");
            const isActive: boolean = row.getValue("isActive")
            return <>
                {isActive
                    ? <Badge className="bg-green-600 hover:bg-green-700 flex gap-2 w-fit">< BadgeCheck /> {t('active')}</Badge >
                    : <Badge className="bg-red-600 hover:bg-red-700 flex gap-2 w-fit"><BadgeMinus /> {t('inactive')}</Badge>
                }
            </>
        },
        size: 120
    },
    {
        accessorKey: "allowMap",
        header: () => {
            const t = useTranslations("dataTables.people.columns.allowMap")
            return (
                <p className="min-w-32">{t('header')}</p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.peopl.columns.allowMap")
            const allowMap: boolean = row.getValue("allowMap")
            return <p className="flex items-center text-muted-foreground truncate">{allowMap ? (
                <>
                    <MapPin className="mr-2" />
                    {t('allowed')}
                </>
            ) : (
                <>
                    <MapPinOff className="mr-2" />
                    {t('notAllowed')}
                </>
            )}</p>
        },
        size: 120
    },
    {
        accessorKey: "locked",
        header: () => {
            const t = useTranslations("dataTables.people.columns");

            return (
                <p>{t('locked.header')}</p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.people.columns.locked");
            const isLocked: boolean = row.getValue("locked")
            return <>
                {isLocked
                    ? <p className="flex items-center text-muted-foreground truncate"><Lock className="mr-2" /> {t('locked')}</p>
                    : <p className="flex items-center text-muted-foreground truncate"><LockOpen className="mr-2" /> {t('unlocked')}</p>
                }
            </>
        },
        size: 120
    },
    {
        accessorKey: "uses",
        header: () => {
            const t = useTranslations("dataTables.people.columns");

            return (
                <p>{t('views.header')}</p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.people.columns.views");
            const uses: string = row.getValue("uses") ?? 0;
            return <p className="flex items-center text-muted-foreground truncate">
                <Eye className="mr-2" /> {t('count', { count: uses })}
            </p>
        },
        size: 120
    },
    {
        accessorKey: "createdAt",
        header: () => {
            const t = useTranslations("dataTables.people.columns");

            return (
                <p>{t('createdAt.header')}</p>
            )
        },
        cell: ({ row }) => {
            const date: Date = row.getValue("createdAt");

            const locale = useLocale();
            return <p className="capitalize truncate">{date.toLocaleDateString(locale, { weekday: "long", day: "numeric", year: "numeric", month: "long" })}</p>
        },
        size: 250
    },
    {
        accessorKey: "expires",
        header: () => {
            const t = useTranslations("dataTables.people.columns");

            return (
                <p>{t('expiresAt.header')}</p>
            )
        },
        cell: ({ row }) => {
            const date: Date = row.getValue("expires");

            const locale = useLocale();
            return <p className="capitalize truncate">{date.toLocaleDateString(locale, { weekday: "long", day: "numeric", year: "numeric", month: "long" })}</p>
        },
        size: 250
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const t = useTranslations("dataTables.people.columns.actions");
            const accessToken = row.original

            const locale = useLocale();
            const [lockOpen, setLockOpen] = useState<boolean>(false);
            const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
            return (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-40">
                            <DropdownMenuLabel>{t('label')}</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={`/app/folders/${accessToken.folder.id}`} className="cursor-default">
                                    {t('open')}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => {
                                toast({
                                    title: t('sendAgain.inProgress.title'),
                                    description: t('sendAgain.inProgress.description'),
                                })
                                const r = await sendAgainAccessToken(accessToken.token);

                                if (r.error) {
                                    toast({
                                        title: t('sendAgain.error.title'),
                                        description: t('sendAgain.error.description'),
                                    })
                                    return;
                                }

                                toast({
                                    title: t('sendAgain.success.title'),
                                    description: t('sendAgain.success.description'),
                                })
                            }}>
                                {t('sendAgain.label')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                {t('edit')}
                            </DropdownMenuItem>
                            {accessToken.isActive
                                ? <DropdownMenuItem onClick={async () => {
                                    const r = await changeAccessTokenActiveState(accessToken.token, false);
                                    if (r.error) {
                                        toast({
                                            title: t('setInactive.error.title'),
                                            description: t('setInactive.error.description'),
                                        })
                                        return;
                                    }
                                    toast({
                                        title: t('setInactive.success.title'),
                                        description: t('setInactive.success.description'),
                                    });
                                }}>{t('setInactive.label')}</DropdownMenuItem>
                                : <DropdownMenuItem onClick={async () => {
                                    const r = await changeAccessTokenActiveState(accessToken.token, true)
                                    if (r.error) {
                                        toast({
                                            title: t('setActive.error.title'),
                                            description: t('setActive.error.description'),
                                        })
                                        return;
                                    }
                                    toast({
                                        title: t('setActive.success.title'),
                                        description: t('setActive.success.description'),
                                    });
                                }}>{t('setActive.label')}</DropdownMenuItem>
                            }
                            {accessToken.allowMap
                                ? <DropdownMenuItem onClick={async () => {
                                    const r = await changeAccessTokenAllowMap(accessToken.id, false)
                                    if (r.error) {
                                        toast({
                                            title: t('allowMap.disable.error.title'),
                                            description: t('allowMap.disable.error.description'),
                                        });
                                        return;
                                    }
                                    toast({
                                        title: t('allowMap.disable.success.title'),
                                        description: t('allowMap.disable.success.description'),
                                    });
                                }}>{t('allowMap.disable.label')}</DropdownMenuItem>
                                : <DropdownMenuItem onClick={async () => {
                                    const r = await changeAccessTokenAllowMap(accessToken.id, true)
                                    if (r.error) {
                                        toast({
                                            title: t('allowMap.enable.error.title'),
                                            description: t('allowMap.enable.error.description'),
                                        });
                                        return;
                                    }
                                    toast({
                                        title: t('allowMap.enable.success.title'),
                                        description: t('allowMap.enable.success.description'),
                                    });
                                }}>{t('allowMap.enable.label')}</DropdownMenuItem>
                            }
                            {accessToken.locked
                                ? <DropdownMenuItem onClick={async () => {
                                    const r = await unlockAccessToken(accessToken.id)

                                    if (r.error) {
                                        toast({
                                            title: t('unlock.error.title'),
                                            description: t('unlock.error.description'),
                                            variant: "destructive"
                                        });
                                        return;
                                    }

                                    toast({
                                        title: t('unlock.success.title'),
                                        description: t('unlock.success.description'),
                                    });
                                }}>{t('unlock.label')}</DropdownMenuItem>
                                : <DropdownMenuItem onClick={() => setLockOpen(true)}>{t('lock')}</DropdownMenuItem>
                            }
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600 focus:text-red-600 font-semibold">{t('delete.label')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <LockTokenDialog tokenId={accessToken.id} openState={lockOpen} setOpenState={setLockOpen} />
                    <DeleteAccessTokenDialog tokens={[accessToken.token]} openState={deleteOpen} setOpenState={setDeleteOpen} />
                </>
            )
        },
        size: 50
    },
]
