"use client";

import { DataTable } from "@/components/ui/data-table";
import { DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import DeleteAccessTokenDialog from "@/components/accessTokens/DeleteAccessTokenDialog";
import { FolderWithLastSlug } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { linksColumns } from "@/components/links/columns";
import { AccessToken } from "@prisma/client";

export default function PersonDataTable({
	accessTokens,
	defaultTokenIndex,
}: {
	readonly accessTokens: (AccessToken & { folder: FolderWithLastSlug })[];
	readonly defaultTokenIndex: number;
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
		setSelectedTokens(Object.keys(selectedTokensIndexes).map(k => accessTokens[Number.parseInt(k)]?.token));
	}, [selectedTokensIndexes, accessTokens]);

	return (
		<DataTable
			columns={linksColumns}
			data={accessTokens}
			selection={selectedTokensIndexes}
			setSelection={setSelectedTokensIndexes}
			filterPlaceholder="Search links"
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
								<Trash2 className="w-4 h-4 mr-2" /> Delete selection
							</Button>
						</DialogTrigger>
					</DeleteAccessTokenDialog>
				</div>
			}
			translations={t}
			states={{ lockOpen, setLockOpen, deleteOpen, setDeleteOpen }}
		/>
	);
}
