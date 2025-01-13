"use client"

import { changeAccessTokenActiveState, unlockAccessToken } from "@/actions/accessTokens";
import DeleteAccessTokenDialog from "@/components/accessTokens/DeleteAccessTokenDialog";
import LockTokenDialog from "@/components/folders/LockTokenDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { AccessTokenWithFolder } from "@/lib/definitions"
import { ColumnDef } from "@tanstack/react-table"
import { count } from "console";
import { ArrowUpDown, BadgeCheck, BadgeMinus, CircleHelp, Eye, Lock, LockOpen, MoreHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export const linksColumns: ColumnDef<AccessTokenWithFolder>[] = [
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
            const t = useTranslations("dataTables.links.columns")

            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    {t('name.header')}
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
        accessorKey: "permission",
        header: () => {
            const t = useTranslations("dataTables.links.columns.permission");
            return (
                <p>{t('header')}</p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.links.columns.permission")
            const permission: string = row.getValue("permission");
            if (permission === "READ") {
                return <Badge className="capitalize bg-blue-600 hover:bg-blue-700">{t('read')}</Badge>
            } else if (permission === "WRITE") {
                return <Badge className="capitalize bg-orange-600 hover:bg-orange-700">{t('write')}</Badge>
            }
        },
        size: 100
    },
    {
        accessorKey: "isActive",
        header: () => {
            const t = useTranslations("dataTables.links.columns.active")
            return (
                <p>{t('header')} <CircleHelp /></p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.links.columns.active")
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
        accessorKey: "locked",
        header: () => {
            const t = useTranslations("dataTables.links.columns.locked")
            return (
                <p>{t('header')}</p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.links.columns.locked")
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
            const t = useTranslations("dataTables.links.columns.views")
            return (
                <p>{t('header')}</p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.links.columns.views")
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
            const t = useTranslations("dataTables.links.columns.createdAt")
            return (
                <p>{t('header')}</p>
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
            const t = useTranslations("dataTables.links.columns.expiresAt")
            return (
                <p>{t('header')}</p>
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
            const t = useTranslations("dataTables.links.columns.actions")
            const accessToken = row.original

            const locale = useLocale();
            const [lockOpen, setLockOpen] = useState<boolean>(false);
            const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
            const link = `http://localhost:3000/${locale}/dashboard/folders/${accessToken.folder.id}?share=${accessToken.token}`;
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
                                <Link href={`http://localhost:3000/${locale}/dashboard/folders/${accessToken.folder.id}`} className="cursor-default">
                                    {t('open')}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                navigator.clipboard.writeText(link);
                                toast({
                                    title: t('copy.success.title'),
                                    description: t('copy.success.description')
                                })
                            }}>
                                {t('copy.label')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                {t('edit')}
                            </DropdownMenuItem>
                            {accessToken.isActive
                                ? <DropdownMenuItem onClick={async () => {
                                    const r = await changeAccessTokenActiveState(accessToken.token, false)
                                    if (r.error) {
                                        toast({
                                            title: t('setInactive.error.title'),
                                            description: t('setInactive.error.description')
                                        })
                                        return;
                                    }
                                    toast({
                                        title: t('setInactive.success.title'),
                                        description: t('setInactive.success.description')
                                    })
                                }}>{t('setInactive.label')}</DropdownMenuItem>
                                : <DropdownMenuItem onClick={async () => {
                                    const r = await changeAccessTokenActiveState(accessToken.token, true)
                                    if (r.error) {
                                        toast({
                                            title: t('setActive.error.title'),
                                            description: t('setActive.error.description')
                                        })
                                        return;
                                    }
                                    toast({
                                        title: t('setActive.success.title'),
                                        description: t('setActive.success.description')
                                    })
                                }}>{t('setActive.label')}</DropdownMenuItem>
                            }
                            {accessToken.locked
                                ? <DropdownMenuItem onClick={() => unlockAccessToken(accessToken.id)}>{t('unlock')}</DropdownMenuItem>
                                : <DropdownMenuItem onClick={() => setLockOpen(true)}>{t('lock')}</DropdownMenuItem>
                            }
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600 focus:text-red-600 font-semibold">{t('delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <LockTokenDialog tokenId={accessToken.id} tokenType="accessToken" openState={lockOpen} setOpenState={setLockOpen} />
                    <DeleteAccessTokenDialog tokens={[accessToken.token]} tokensType="links" openState={deleteOpen} setOpenState={setDeleteOpen} />
                </>
            )
        },
        size: 50
    },
]
