import { FolderTag } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "motion/react";

export default function TagChip({ tag, checked, showCheckbox, onTagSelected, onTagUnselected }: { tag: FolderTag, checked?: boolean, showCheckbox?: boolean, onTagSelected?: (tag: FolderTag) => void, onTagUnselected?: (tag: FolderTag) => void }) {

    if (!showCheckbox) {
        return (
            <Badge className={cn("cursor-default px-2.5 py-1.5 rounded-full")}>
                {tag.name}
            </Badge>
        )
    }

    return (
        <Badge variant={"outline"} className={cn("cursor-default px-2.5 py-1.5 rounded-full", "flex items-start gap-2")} onClick={() => {
            if (checked) {
                onTagUnselected?.(tag);
            } else {
                onTagSelected?.(tag);
            }
        }}>
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: checked ? 16 : 0, opacity: checked ? 1 : 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
            >
                {checked && <Check className="size-4" />}
            </motion.div>
            {tag.name}
        </Badge>
    )
}