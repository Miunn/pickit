import { FolderTokenPermission } from "@prisma/client";
import { Bolt, Eye, Pencil } from "lucide-react";

const className = "size-4 shrink-0";

export default function LinkIcon({ permission }: { readonly permission: FolderTokenPermission }) {
	switch (permission) {
		case FolderTokenPermission.READ:
			return <Eye className={className} />;
		case FolderTokenPermission.WRITE:
			return <Pencil className={className} />;
		case FolderTokenPermission.ADMIN:
			return <Bolt className={className} />;
		default:
			return <Eye className={className} />;
	}
}
