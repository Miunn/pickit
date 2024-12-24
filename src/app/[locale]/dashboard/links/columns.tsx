"use client"

import { changeAccessTokenActiveState } from "@/actions/accessTokens";
import DeleteAccessTokenDialog from "@/components/accessTokens/DeleteAccessTokenDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogPortal, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { AccessTokenWithFolder } from "@/lib/definitions"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, BadgeCheck, BadgeMinus, Eye, MoreHorizontal } from "lucide-react";
import { useLocale } from "next-intl";
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
    },
    {
        id: "folder_name",
        accessorKey: "folder.name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Folders name
                    <ArrowUpDown className="w-4 h-4 ml-2" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const name: string = row.getValue("folder_name");
            return <p className="font-semibold">{name}</p>
        }
    },
    {
        accessorKey: "permission",
        header: "Permission",
        cell: ({ row }) => {
            const permission: string = row.getValue("permission");
            if (permission === "READ") {
                return <Badge className="capitalize bg-blue-600 hover:bg-blue-700">{permission}</Badge>
            } else if (permission === "WRITE") {
                return <Badge className="capitalize bg-orange-600 hover:bg-orange-700">{permission}</Badge>
            }
        }
    },
    {
        accessorKey: "isActive",
        header: "Is active",
        cell: ({ row }) => {
            const isActive: boolean = row.getValue("isActive")
            return <>
                {isActive
                    ? <Badge className="bg-green-600 hover:bg-green-700 flex gap-2 w-fit">< BadgeCheck /> Active</Badge >
                    : <Badge className="bg-red-600 hover:bg-red-700 flex gap-2 w-fit"><BadgeMinus /> Inactive</Badge>
                }
            </>
        }
    },
    {
        accessorKey: "uses",
        header: "Views",
        cell: ({ row }) => {
            const uses: string = row.getValue("uses") ?? 0;
            return <p className="flex items-center text-muted-foreground">
                <Eye className="mr-2" /> {uses} views
            </p>
        }
    },
    {
        accessorKey: "createdAt",
        header: "Created at",
        cell: ({ row }) => {
            const date: Date = row.getValue("createdAt");
            return <p className="capitalize">{date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", year: "numeric", month: "long" })}</p>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const accessToken = row.original

            const locale = useLocale();
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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                                navigator.clipboard.writeText(link);
                                toast({
                                    title: "Copied !",
                                    description: "Link copied to your clipboard"
                                })
                            }}>
                                Copy link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href={`http://localhost:3000/${locale}/dashboard/folders/${accessToken.folder.id}`} className="cursor-default">
                                    View folder
                                </Link>
                            </DropdownMenuItem>
                            {accessToken.isActive
                                ? <DropdownMenuItem onClick={() => changeAccessTokenActiveState(accessToken.token, false)}>Set as inactive</DropdownMenuItem>
                                : <DropdownMenuItem onClick={() => changeAccessTokenActiveState(accessToken.token, true)}>Set as active</DropdownMenuItem>
                            }
                            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600 focus:text-red-600 font-semibold">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DeleteAccessTokenDialog token={accessToken.token} openState={deleteOpen} setOpenState={setDeleteOpen} />
                </>
            )
        },
    },
]
