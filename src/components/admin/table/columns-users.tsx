"use client";

import DeleteUserDialog from "@/components/admin/users/DeleteUserDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAdministration } from "@/lib/definitions";
import { formatBytes } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";

export const usersColumns: ColumnDef<UserAdministration>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={value => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 50,
    },
    {
        accessorKey: "name",
        header: ({ table }) => {
            const t = table.options.meta?.intl?.translations;
            return <p>{t?.("name.header")}</p>;
        },
        cell: ({ row }) => {
            const name: string = row.getValue("name");
            const id = row.original.id;
            return (
                <Button variant={"link"} className="truncate font-semibold" asChild>
                    <Link href={`/app/administration/users/${id}`}>{name}</Link>
                </Button>
            );
        },
    },
    {
        accessorKey: "email",
        header: ({ table }) => {
            const t = table.options.meta?.intl?.translations;
            return <p>{t?.("email.header")}</p>;
        },
    },
    {
        accessorKey: "emailVerified",
        header: ({ table }) => {
            const t = table.options.meta?.intl?.translations;

            return <p>{t?.("emailVerified.header")}</p>;
        },
        cell: ({ table, row }) => {
            const t = table.options.meta?.intl?.translations;
            const emailVerified: boolean = row.getValue("emailVerified");

            if (emailVerified) {
                return (
                    <Badge className="bg-green-600 hover:bg-green-700 font-semibold">
                        {t?.("emailVerified.verified")}
                    </Badge>
                );
            } else {
                const emailVerifiedDeadline: Date | null = row.original.emailVerificationDeadline;
                const formatter = table.options.meta?.intl?.formatter;

                return (
                    <Tooltip>
                        <TooltipTrigger>
                            <Badge className="bg-red-600 hover:bg-red-700 font-bold">
                                {t?.("emailVerified.unverified")}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>
                                {emailVerifiedDeadline
                                    ? t?.("emailVerified.unverifiedDeadline", {
                                          date: formatter?.dateTime(emailVerifiedDeadline, {
                                              weekday: "long",
                                              day: "numeric",
                                              year: "numeric",
                                              month: "long",
                                          }),
                                      })
                                    : t?.("emailVerified.unverifiedDeadlineNull")}
                            </p>
                        </TooltipContent>
                    </Tooltip>
                );
            }
        },
    },
    {
        id: "count_folders",
        accessorKey: "_count.folders",
        header: ({ table }) => {
            const t = table.options.meta?.intl?.translations;
            return <p>{t?.("folders.header")}</p>;
        },
        cell: ({ table, row }) => {
            const t = table.options.meta?.intl?.translations;
            const folders: string = row.getValue("count_folders");
            return <p className="truncate">{t?.("folders.count", { count: Number.parseInt(folders) })}</p>;
        },
    },
    {
        id: "count_images",
        accessorKey: "_count.images",
        header: ({ table }) => {
            const t = table.options.meta?.intl?.translations;
            return <p className="truncate">{t?.("images.header")}</p>;
        },
        cell: ({ table, row }) => {
            const t = table.options.meta?.intl?.translations;
            const images: string = row.getValue("count_images");
            return <p>{t?.("images.count", { count: Number.parseInt(images) })}</p>;
        },
    },
    {
        accessorKey: "usedStorage",
        header: ({ table }) => {
            const t = table.options.meta?.intl?.translations;
            return <p>{t?.("usedStorage.header")}</p>;
        },
        cell: ({ table, row }) => {
            const t = table.options.meta?.intl?.translations;
            const usedStorage: string = formatBytes(Number(row.getValue("usedStorage")));
            return <p>{t?.("usedStorage.count", { count: usedStorage })}</p>;
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ table }) => {
            const t = table.options.meta?.intl?.translations;
            return <p>{t?.("createdAt.header")}</p>;
        },
        cell: ({ table, row }) => {
            const formatter = table.options.meta?.intl?.formatter;
            const date = row.original.createdAt;

            return (
                <p className="capitalize truncate">
                    {formatter?.dateTime(date, {
                        weekday: "long",
                        day: "numeric",
                        year: "numeric",
                        month: "long",
                    })}
                </p>
            );
        },
    },
    {
        accessorKey: "updatedAt",
        header: ({ table }) => {
            const t = table.options.meta?.intl?.translations;
            return <p>{t?.("updatedAt.header")}</p>;
        },
        cell: ({ table, row }) => {
            const formatter = table.options.meta?.intl?.formatter;
            const date: Date = row.getValue("updatedAt");

            return (
                <p className="capitalize truncate">
                    {formatter?.dateTime(date, {
                        weekday: "long",
                        day: "numeric",
                        year: "numeric",
                        month: "long",
                    })}
                </p>
            );
        },
    },
    {
        id: "actions",
        cell: ({ table, row }) => {
            const t = table.options.meta?.intl?.translations;
            const deleteOpen = table.options.meta?.states?.deleteOpen as boolean;
            const setDeleteOpen = table.options.meta?.states?.setDeleteOpen as (open: boolean) => void;
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
                            <DropdownMenuLabel>{t?.("actions.label")}</DropdownMenuLabel>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`/app/administration/users/${user.id}`}>{t?.("actions.edit")}</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 font-semibold"
                                onClick={() => setDeleteOpen(true)}
                            >
                                {t?.("actions.delete.label")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DeleteUserDialog user={user} open={deleteOpen} setOpen={setDeleteOpen} />
                </>
            );
        },
        size: 50,
    },
];
