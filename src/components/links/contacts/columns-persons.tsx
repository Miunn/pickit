"use client";

import {
	changeAccessTokenActiveState,
	changeAccessTokenAllowMap,
	sendAgainAccessToken,
	unlockAccessToken,
} from "@/actions/accessTokens";
import DeleteAccessTokenDialog from "@/components/accessTokens/DeleteAccessTokenDialog";
import LockTokenDialog from "@/components/folders/dialogs/LockTokenDialog";
import ActiveBadge from "@/components/generic/ActiveBadge";
import ActiveTooltip from "@/components/generic/ActiveTooltip";
import LockBadge from "@/components/generic/LockBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Link } from "@/i18n/navigation";
import { select } from "@/lib/columns-common";
import { AccessTokenWithFolder } from "@/lib/definitions";
import { ColumnDef } from "@tanstack/react-table";
import {
	ArrowUpDown,
	BadgeCheck,
	BadgeMinus,
	Eye,
	MapPin,
	MapPinOff,
	MoreHorizontal,
	Pencil,
	PencilOff,
} from "lucide-react";

// Define the permission values as constants
const PERMISSIONS = {
	READ: "READ" as const,
	WRITE: "WRITE" as const,
	ADMIN: "ADMIN" as const,
} as const;

export const personColumns: ColumnDef<AccessTokenWithFolder>[] = [
	select as ColumnDef<AccessTokenWithFolder>,
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
					{t?.("name.header")}
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
		accessorKey: "email",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;

			return <p>{t?.("email.header")}</p>;
		},
		size: 340,
	},
	{
		accessorKey: "permission",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;
			return <p>{t?.("permission.header")}</p>;
		},
		cell: ({ table, row }) => {
			const t = table.options.meta?.intl?.translations;
			const permission: string = row.getValue("permission");
			if (permission === PERMISSIONS.READ) {
				return (
					<Badge className="bg-blue-600 hover:bg-blue-700 flex gap-2 w-fit">
						<PencilOff /> {t?.("permission.read")}
					</Badge>
				);
			}
			if (permission === PERMISSIONS.WRITE) {
				return (
					<Badge className="bg-green-600 hover:bg-green-700 flex gap-2 w-fit">
						<Pencil /> {t?.("permission.write")}
					</Badge>
				);
			}
			if (permission === PERMISSIONS.ADMIN) {
				return (
					<Badge className="bg-purple-600 hover:bg-purple-700 flex gap-2 w-fit">
						<BadgeCheck /> {t?.("permission.admin")}
					</Badge>
				);
			}
			return (
				<Badge className="bg-gray-600 hover:bg-gray-700 flex gap-2 w-fit">
					<BadgeMinus /> {t?.("permission.none")}
				</Badge>
			);
		},
		size: 260,
	},
	{
		accessorKey: "isActive",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;

			return (
				<p className="flex gap-2 items-center">
					{t?.("active.header")}
					<ActiveTooltip t={t} tooltipKey="active.tooltip" />
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
					activeKey="active.active"
					inactiveKey="active.inactive"
				/>
			);
		},
		size: 120,
	},
	{
		accessorKey: "allowMap",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;
			return <p className="min-w-32">{t?.("allowMap.header")}</p>;
		},
		cell: ({ table, row }) => {
			const t = table.options.meta?.intl?.translations;
			const allowMap: boolean = row.getValue("allowMap");
			return (
				<p className="flex items-center text-muted-foreground truncate">
					{allowMap ? (
						<>
							<MapPin className="mr-2" />
							{t?.("allowMap.allowed")}
						</>
					) : (
						<>
							<MapPinOff className="mr-2" />
							{t?.("allowMap.notAllowed")}
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

			return <p>{t?.("locked.header")}</p>;
		},
		cell: ({ table, row }) => {
			const t = table.options.meta?.intl?.translations;
			const isLocked: boolean = row.getValue("locked");
			return (
				<LockBadge
					isLocked={isLocked}
					t={t}
					lockedKey="locked.locked"
					unlockedKey="locked.unlocked"
				/>
			);
		},
		size: 120,
	},
	{
		accessorKey: "uses",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;

			return <p>{t?.("views.header")}</p>;
		},
		cell: ({ table, row }) => {
			const t = table.options.meta?.intl?.translations;
			const uses: string = row.getValue("uses") ?? 0;
			return (
				<p className="flex items-center text-muted-foreground truncate">
					<Eye className="mr-2" /> {t?.("views.count", { count: uses })}
				</p>
			);
		},
		size: 120,
	},
	{
		accessorKey: "createdAt",
		header: ({ table }) => {
			const t = table.options.meta?.intl?.translations;
			return <p>{t?.("createdAt.header")}</p>;
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

			return <p>{t?.("expiresAt.header")}</p>;
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
			const accessToken = row.original;
			const lockOpen = table.options.meta?.states?.lockOpen as boolean;
			const setLockOpen = table.options.meta?.states?.setLockOpen as React.Dispatch<
				React.SetStateAction<boolean>
			>;
			const deleteOpen = table.options.meta?.states?.deleteOpen as boolean;
			const setDeleteOpen = table.options.meta?.states?.setDeleteOpen as React.Dispatch<
				React.SetStateAction<boolean>
			>;
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
							<DropdownMenuItem asChild>
								<Link
									href={`/app/folders/${accessToken.folder.id}`}
									className="cursor-default"
								>
									{t?.("actions.open")}
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={async () => {
									toast({
										title: t?.(
											"actions.sendAgain.inProgress.title"
										),
										description: t?.(
											"actions.sendAgain.inProgress.description"
										),
									});
									const r = await sendAgainAccessToken(
										accessToken.token
									);

									if (r.error) {
										toast({
											title: t?.(
												"actions.sendAgain.error.title"
											),
											description: t?.(
												"actions.sendAgain.error.description"
											),
										});
										return;
									}

									toast({
										title: t?.(
											"actions.sendAgain.success.title"
										),
										description: t?.(
											"actions.sendAgain.success.description"
										),
									});
								}}
							>
								{t?.("actions.sendAgain.label")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem>{t?.("actions.edit")}</DropdownMenuItem>
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
													"actions.setInactive.error.title"
												),
												description: t?.(
													"actions.setInactive.error.description"
												),
											});
											return;
										}
										toast({
											title: t?.(
												"actions.setInactive.success.title"
											),
											description: t?.(
												"actions.setInactive.success.description"
											),
										});
									}}
								>
									{t?.("actions.setInactive.label")}
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
													"actions.setActive.error.title"
												),
												description: t?.(
													"actions.setActive.error.description"
												),
											});
											return;
										}
										toast({
											title: t?.(
												"actions.setActive.success.title"
											),
											description: t?.(
												"actions.setActive.success.description"
											),
										});
									}}
								>
									{t?.("actions.setActive.label")}
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
													"actions.allowMap.disable.error.title"
												),
												description: t?.(
													"actions.allowMap.disable.error.description"
												),
											});
											return;
										}
										toast({
											title: t?.(
												"actions.allowMap.disable.success.title"
											),
											description: t?.(
												"actions.allowMap.disable.success.description"
											),
										});
									}}
								>
									{t?.("actions.allowMap.disable.label")}
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
													"actions.allowMap.enable.error.title"
												),
												description: t?.(
													"actions.allowMap.enable.error.description"
												),
											});
											return;
										}
										toast({
											title: t?.(
												"actions.allowMap.enable.success.title"
											),
											description: t?.(
												"actions.allowMap.enable.success.description"
											),
										});
									}}
								>
									{t?.("actions.allowMap.enable.label")}
								</DropdownMenuItem>
							)}
							{accessToken.locked ? (
								<DropdownMenuItem
									onClick={async () => {
										const r = await unlockAccessToken(
											accessToken.id
										);

										if (r.error) {
											toast({
												title: t?.(
													"actions.unlock.error.title"
												),
												description: t?.(
													"actions.unlock.error.description"
												),
												variant: "destructive",
											});
											return;
										}

										toast({
											title: t?.(
												"actions.unlock.success.title"
											),
											description: t?.(
												"actions.unlock.success.description"
											),
										});
									}}
								>
									{t?.("actions.unlock.label")}
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem onClick={() => setLockOpen(true)}>
									{t?.("actions.lock")}
								</DropdownMenuItem>
							)}
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => setDeleteOpen(true)}
								className="text-red-600 focus:text-red-600 font-semibold"
							>
								{t?.("actions.delete.label")}
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
