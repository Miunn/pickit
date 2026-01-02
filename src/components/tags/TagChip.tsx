import { FolderTag } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "motion/react";

export default function TagChip({
    tag,
    className,
    checked,
    showCheckbox,
    onTagSelected,
    onTagUnselected,
}: {
    readonly tag: FolderTag;
    readonly className?: string;
    readonly checked?: boolean;
    readonly showCheckbox?: boolean;
    readonly onTagSelected?: (tag: FolderTag) => void;
    readonly onTagUnselected?: (tag: FolderTag) => void;
}) {
    // Convert hex color to rgb
    const rgb = tag.color.match(/\w\w/g)?.map(hex => Number.parseInt(hex, 16)) ?? [0, 0, 0];

    // Multiple each color by 1/2 for background color
    const backgroundColor = `rgb(${rgb.map(c => Math.round(c + 0.85 * (255 - c))).join(",")})`;
    const textColor = `rgb(${rgb.map(c => Math.round(0.65 * c)).join(",")})`;

    if (!showCheckbox) {
        return (
            <Badge
                className={cn("cursor-default px-2.5 py-1.5 rounded-full", className)}
                style={{
                    borderColor: textColor,
                    backgroundColor: backgroundColor,
                    color: textColor,
                }}
            >
                <span className="truncate">{tag.name}</span>
            </Badge>
        );
    }

    return (
        <Badge
            variant={"outline"}
            className={cn("cursor-default px-2.5 py-1.5 rounded-full", "flex items-start")}
            onClick={() => {
                if (checked) {
                    onTagUnselected?.(tag);
                } else {
                    onTagSelected?.(tag);
                }
            }}
            style={{
                borderColor: textColor,
                backgroundColor: backgroundColor,
                color: textColor,
            }}
        >
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: checked ? 24 : 0, opacity: checked ? 1 : 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
            >
                {checked && <Check className={cn("size-4 mr-2")} style={{ color: textColor }} />}
            </motion.div>
            <span className="truncate">{tag.name}</span>
        </Badge>
    );
}
