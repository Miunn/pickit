import "@tanstack/table-core";
import { createFormatter, createTranslator } from "next-intl";

declare module "@tanstack/table-core" {
    export interface TableMeta {
        imagesListActions?: {
            setCarouselOpen: React.Dispatch<React.SetStateAction<boolean>>;
            setStartIndex: React.Dispatch<React.SetStateAction<number>>;
        };
        intl?: {
            translations?: ReturnType<typeof createTranslator>;
            formatter: ReturnType<typeof createFormatter>;
        };
    }
}
