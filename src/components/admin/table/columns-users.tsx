"use client"

import DeleteUserDialog from "@/components/admin/users/DeleteUserDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAdministration } from "@/lib/definitions"
import { formatBytes } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

export const usersColumns: ColumnDef<UserAdministration>[] = [
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
        accessorKey: "name",
        header: () => {
            const t = useTranslations("dataTables.users.columns.name")
            return (
                <p>{t('header')}</p>
            )
        },
        cell: ({ row }) => {
            const name: string = row.getValue("name");
            const id = row.original.id;
            return <Button variant={'link'} className="truncate font-semibold" asChild>
                <Link href={`/app/administration/users/${id}`}>{name}</Link>
            </Button>
        }
    },
    {
        accessorKey: "email",
        header: () => {
            const t = useTranslations("dataTables.users.columns.email")
            return (
                <p>{t('header')}</p>
            )
        },
    },
    {
        accessorKey: "emailVerified",
        header: () => {
            const t = useTranslations("dataTables.users.columns.emailVerified")
            return (
                <p>{t('header')}</p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.users.columns.emailVerified");
            const emailVerified: boolean = row.getValue("emailVerified");

            if (emailVerified) {
                return <Badge className="bg-green-600 hover:bg-green-700 font-semibold">{t('verified')}</Badge>
            } else {
                const emailVerifiedDeadline: Date | null = row.original.emailVerificationDeadline;
                const locale = useLocale();

                return (
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge className="bg-red-600 hover:bg-red-700 font-bold">{t('unverified')}</Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('unverifiedDeadline', { date: emailVerifiedDeadline?.toLocaleDateString(locale, { weekday: "long", day: "numeric", year: "numeric", month: "long" }) }) || t('unverifiedDeadlineNull')}</p>
                        </TooltipContent>
                    </Tooltip>
                )
            }
        }
    },
    {
        id: "count_folders",
        accessorKey: "_count.folders",
        header: () => {
            const t = useTranslations("dataTables.users.columns.folders")
            return (
                <p>{t('header')}</p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.users.columns.folders");
            const folders: string = row.getValue("count_folders");
            return <p className="truncate">{t('count', { count: parseInt(folders) })}</p>
        }
    },
    {
        id: "count_images",
        accessorKey: "_count.images",
        header: () => {
            const t = useTranslations("dataTables.users.columns.images")
            return (
                <p className="truncate">{t('header')}</p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.users.columns.images");
            const images: string = row.getValue("count_images");
            return <p>{t('count', { count: parseInt(images) })}</p>
        }
    },
    {
        accessorKey: "usedStorage",
        header: () => {
            const t = useTranslations("dataTables.users.columns.usedStorage")
            return (
                <p>{t('header')}</p>
            )
        },
        cell: ({ row }) => {
            const t = useTranslations("dataTables.users.columns.usedStorage");
            const usedStorage: string = formatBytes(Number(row.getValue("usedStorage")));
            return <p>{t('count', { count: usedStorage })}</p>
        }
    },
    {
        accessorKey: "createdAt",
        header: () => {
            const t = useTranslations("dataTables.users.columns.createdAt")
            return (
                <p>{t('header')}</p>
            )
        },
        cell: ({ row }) => {
            const date: Date = row.getValue("createdAt");

            const locale = useLocale();
            return <p className="capitalize truncate">{date.toLocaleDateString(locale, { weekday: "long", day: "numeric", year: "numeric", month: "long" })}</p>
        }
    },
    {
        accessorKey: "updatedAt",
        header: () => {
            const t = useTranslations("dataTables.users.columns.updatedAt");
            return (
                <p>{ t('header') }</p>
            )
        },
        cell: ({ row }) => {
            const date: Date = row.getValue("updatedAt");

            const locale = useLocale();
            return <p className="capitalize truncate">{date.toLocaleDateString(locale, { weekday: "long", day: "numeric", year: "numeric", month: "long" })}</p>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const t = useTranslations("dataTables.users.columns.actions");
            const [deleteOpen, setDeleteOpen] = useState(false);
            const user = row.original;
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

                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/app/administration/users/${user.id}`}>
                                    {t('edit')}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 font-semibold" onClick={() => setDeleteOpen(true)}>{t('delete.label')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DeleteUserDialog user={user} open={deleteOpen} setOpen={setDeleteOpen} />
                </>
            )
        },
        size: 50
    },
]
