"use client";

import { DataTable } from "@/components/ui/data-table";
import CreateAccessTokenDialog from "@/components/accessTokens/CreateAccessTokenDialog";
import { DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link, Trash2 } from "lucide-react";
import DeleteAccessTokenDialog from "@/components/accessTokens/DeleteAccessTokenDialog";
import { AccessTokenWithFolder, LightFolder } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { linksColumns } from "./columns";

export default function LinksDataTable({
	accessTokens,
	defaultTokenIndex,
	lightFolders,
}: {
	readonly accessTokens: AccessTokenWithFolder[];
	readonly defaultTokenIndex: number;
	readonly lightFolders: LightFolder[];
}) {
	const t = useTranslations("dataTables.links");
	const [selectedTokensIndexes, setSelectedTokensIndexes] = useState<{ [index: number]: boolean }>(
		defaultTokenIndex === -1 ? {} : { [defaultTokenIndex]: true }
	);
	const [selectedTokens, setSelectedTokens] = useState<string[]>(
		defaultTokenIndex === -1 ? [] : [accessTokens[defaultTokenIndex].token]
	);

	const [lockOpen, setLockOpen] = useState<boolean>(false);
	const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
	const [deleteSelectionOpen, setDeleteSelectionOpen] = useState<boolean>(false);

	useEffect(() => {
		setSelectedTokens(Object.keys(selectedTokensIndexes).map(k => accessTokens[Number.parseInt(k)].token));
	}, [selectedTokensIndexes, accessTokens]);

	return (
		<DataTable
			columns={linksColumns.filter(c => c.id !== "email")}
			data={accessTokens}
			selection={selectedTokensIndexes}
			setSelection={setSelectedTokensIndexes}
			filterPlaceholder={t("actions.search.placeholder")}
			filterColumn="folder_name"
			rightHeadingNodes={
				<div className="flex gap-2">
					<DeleteAccessTokenDialog
						tokens={selectedTokens}
						openState={deleteSelectionOpen}
						setOpenState={setDeleteSelectionOpen}
						submitNext={() => setSelectedTokensIndexes({})}
					>
						<DialogTrigger asChild>
							<Button
								variant="outline"
								disabled={selectedTokens.length === 0}
								className={
									selectedTokens.length === 0
										? "!opacity-0"
										: "opacity-100"
								}
							>
								<Trash2 className="w-4 h-4 mr-2" />{" "}
								{t("actions.deleteSelected")}
							</Button>
						</DialogTrigger>
					</DeleteAccessTokenDialog>
					<CreateAccessTokenDialog folders={lightFolders}>
						<DialogTrigger asChild>
							<Button variant="outline">
								<Link className="w-4 h-4 mr-2" /> {t("actions.create")}
							</Button>
						</DialogTrigger>
					</CreateAccessTokenDialog>
				</div>
			}
			translations={t}
			states={{ lockOpen, setLockOpen, deleteOpen, setDeleteOpen }}
		/>
	);
}
