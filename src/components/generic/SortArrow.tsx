import { SortDirection } from "@/types/imagesSort";
import { ArrowDown, ArrowUp } from "lucide-react";

export default function SortArrow({ direction }: { readonly direction?: SortDirection | null }) {
	if (!direction) return null;

	if (direction === SortDirection.Asc) {
		return <ArrowUp className="w-4 h-4" />;
	}

	return <ArrowDown className="w-4 h-4" />;
}
