"use client";

import { changeAccessTokenActiveState, changeAccessTokenAllowMap, unlockAccessToken } from "@/actions/accessTokens";
import DeleteAccessTokenDialog from "@/components/accessTokens/DeleteAccessTokenDialog";
import LockTokenDialog from "@/components/folders/dialogs/LockTokenDialog";
import ActiveBadge from "@/components/generic/ActiveBadge";
import ActiveTooltip from "@/components/generic/ActiveTooltip";
import LockBadge from "@/components/generic/LockBadge";
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
import { toast } from "@/hooks/use-toast";
import { AccessTokenWithFolder } from "@/lib/definitions";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye, MapPin, MapPinOff, MoreHorizontal, Pencil, PencilOff } from "lucide-react";
import Link from "next/link";

export const linksColumns: ColumnDef<AccessTokenWithFolder>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
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
		id: "folder_name",
		accessorKey: "folder.name",
		header: ({ table, column }) => {
			const t = table.options.meta?.intl?.translations;

			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					{t?.("columns.name.header")}
					<ArrowUpDown className="w-4 h-4 ml-2" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const name: string = row.getValue("folder_name");
			return <p className="font-semibold truncate">{name}</p>;
		},
	},
	{
		accessorKey: "permission",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;

			return <p>{t?.("columns.permission.header")}</p>;
		},
		cell: ({ table, row }) => {
			const t = table.options.meta?.intl?.translations;

			const permission: string = row.getValue("permission");
			if (permission === "READ") {
				return (
					<Badge className="capitalize bg-blue-600 hover:bg-blue-700 flex gap-2 w-fit">
						<PencilOff /> {t?.("columns.permission.read")}
					</Badge>
				);
			} else if (permission === "WRITE") {
				return (
					<Badge className="capitalize bg-orange-600 hover:bg-orange-700 flex gap-2 w-fit">
						<Pencil />
						{t?.("columns.permission.write")}
					</Badge>
				);
			}
		},
		size: 260,
	},
	{
		accessorKey: "isActive",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;
			return (
				<p className="flex gap-2 items-center">
					{t?.("columns.active.header")}
					<ActiveTooltip t={t} tooltipKey="columns.active.tooltip" />
				</p>
			);
		},
		cell: ({ table, row }) => {
			const t = table.options.meta?.intl?.translations;
			const isActive: boolean = row.getValue("isActive");
			return (
				<ActiveBadge
					isActive={isActive}
					t={t}
					activeKey="columns.active.active"
					inactiveKey="columns.active.inactive"
				/>
			);
		},
		size: 120,
	},
	{
		accessorKey: "allowMap",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;
			return <p>{t?.("columns.allowMap.header")}</p>;
		},
		cell: ({ table, row }) => {
			const t = table.options.meta?.intl?.translations;
			const allowMap: boolean = row.getValue("allowMap");
			return (
				<p className="flex items-center text-muted-foreground truncate">
					{allowMap ? (
						<>
							<MapPin className="mr-2" />
							{t?.("columns.allowMap.allowed")}
						</>
					) : (
						<>
							<MapPinOff className="mr-2" />
							{t?.("columns.allowMap.notAllowed")}
						</>
					)}
				</p>
			);
		},
		size: 120,
	},
	{
		accessorKey: "locked",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;
			return <p>{t?.("columns.locked.header")}</p>;
		},
		cell: ({ table, row }) => {
			const t = table.options.meta?.intl?.translations;
			const isLocked: boolean = row.getValue("locked");
			return (
				<LockBadge
					isLocked={isLocked}
					t={t}
					lockedKey="columns.locked.locked"
					unlockedKey="columns.locked.unlocked"
				/>
			);
		},
		size: 120,
	},
	{
		accessorKey: "uses",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;
			return <p>{t?.("columns.views.header")}</p>;
		},
		cell: ({ table, row }) => {
			const t = table.options.meta?.intl?.translations;
			const uses: string = row.getValue("uses") ?? 0;
			return (
				<p className="flex items-center text-muted-foreground truncate">
					<Eye className="mr-2" /> {t?.("columns.views.count", { count: uses })}
				</p>
			);
		},
		size: 120,
	},
	{
		accessorKey: "createdAt",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;
			return <p>{t?.("columns.createdAt.header")}</p>;
		},
		cell: ({ table, row }) => {
			const formatter = table.options.meta?.intl?.formatter;
			const date: Date = row.getValue("createdAt");

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
		size: 250,
	},
	{
		accessorKey: "expires",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;
			return <p>{t?.("columns.expiresAt.header")}</p>;
		},
		cell: ({ table, row }) => {
			const formatter = table.options.meta?.intl?.formatter;
			const date: Date = row.getValue("expires");

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
		size: 250,
	},
	{
		id: "actions",
		cell: ({ table, row }) => {
			const t = table.options.meta?.intl?.translations;
			const locale = table.options.meta?.locale || "en";
			const accessToken = row.original;

			const states = table.options.meta?.states;
			const lockOpen = (states?.lockOpen as boolean) || false;
			const setLockOpen = states?.setLockOpen as React.Dispatch<React.SetStateAction<boolean>>;
			const deleteOpen = (states?.deleteOpen as boolean) || false;
			const setDeleteOpen = states?.setDeleteOpen as React.Dispatch<React.SetStateAction<boolean>>;

			const link = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/app/folders/${accessToken.folder.id}?share=${accessToken.token}`;

			return (
				<>
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Open menu</span>
								<MoreHorizontal />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="min-w-40">
							<DropdownMenuLabel>
								{t?.("columns.actions.label")}
							</DropdownMenuLabel>
							<DropdownMenuItem asChild>
								<Link
									href={`/${locale}/app/folders/${accessToken.folder.id}`}
									className="cursor-default"
								>
									{t?.("columns.actions.open")}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => {
									navigator.clipboard.writeText(link);
									toast({
										title: t?.(
											"columns.actions.copy.success.title"
										),
										description: t?.(
											"columns.actions.copy.success.description"
										),
									});
								}}
							>
								{t?.("columns.actions.copy.label")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								{t?.("columns.actions.edit")}
							</DropdownMenuItem>
							{accessToken.isActive ? (
								<DropdownMenuItem
									onClick={async () => {
										const r =
											await changeAccessTokenActiveState(
												accessToken.token,
												false
											);
										if (r.error) {
											toast({
												title: t?.(
													"columns.actions.setInactive.error.title"
												),
												description: t?.(
													"columns.actions.setInactive.error.description"
												),
											});
											return;
										}
										toast({
											title: t?.(
												"columns.actions.setInactive.success.title"
											),
											description: t?.(
												"columns.actions.setInactive.success.description"
											),
										});
									}}
								>
									{t?.("columns.actions.setInactive.label")}
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem
									onClick={async () => {
										const r =
											await changeAccessTokenActiveState(
												accessToken.token,
												true
											);
										if (r.error) {
											toast({
												title: t?.(
													"columns.actions.setActive.error.title"
												),
												description: t?.(
													"columns.actions.setActive.error.description"
												),
											});
											return;
										}
										toast({
											title: t?.(
												"columns.actions.setActive.success.title"
											),
											description: t?.(
												"columns.actions.setActive.success.description"
											),
										});
									}}
								>
									{t?.("columns.actions.setActive.label")}
								</DropdownMenuItem>
							)}
							{accessToken.allowMap ? (
								<DropdownMenuItem
									onClick={async () => {
										const r =
											await changeAccessTokenAllowMap(
												accessToken.id,
												false
											);
										if (r.error) {
											toast({
												title: t?.(
													"columns.actions.allowMap.disable.error.title"
												),
												description: t?.(
													"columns.actions.allowMap.disable.error.description"
												),
											});
											return;
										}
										toast({
											title: t?.(
												"columns.actions.allowMap.disable.success.title"
											),
											description: t?.(
												"columns.actions.allowMap.disable.success.description"
											),
										});
									}}
								>
									{t?.("columns.actions.allowMap.disable.label")}
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem
									onClick={async () => {
										const r =
											await changeAccessTokenAllowMap(
												accessToken.id,
												true
											);
										if (r.error) {
											toast({
												title: t?.(
													"columns.actions.allowMap.enable.error.title"
												),
												description: t?.(
													"columns.actions.allowMap.enable.error.description"
												),
											});
											return;
										}
										toast({
											title: t?.(
												"columns.actions.allowMap.enable.success.title"
											),
											description: t?.(
												"columns.actions.allowMap.enable.success.description"
											),
										});
									}}
								>
									{t?.("columns.actions.allowMap.enable.label")}
								</DropdownMenuItem>
							)}
							{accessToken.locked ? (
								<DropdownMenuItem
									onClick={() =>
										unlockAccessToken(accessToken.id)
									}
								>
									{t?.("columns.actions.unlock")}
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem onClick={() => setLockOpen(true)}>
									{t?.("columns.actions.lock")}
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => setDeleteOpen(true)}
								className="text-red-600 focus:text-red-600 font-semibold"
							>
								{t?.("columns.actions.delete.label")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					<LockTokenDialog
						tokenId={accessToken.id}
						openState={lockOpen}
						setOpenState={setLockOpen}
					/>
					<DeleteAccessTokenDialog
						tokens={[accessToken.token]}
						openState={deleteOpen}
						setOpenState={setDeleteOpen}
					/>
				</>
			);
		},
		size: 50,
	},
];
