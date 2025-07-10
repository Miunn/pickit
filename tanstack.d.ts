import '@tanstack/table-core';
import { createFormatter } from 'next-intl';

declare module '@tanstack/table-core' {
    export interface TableMeta<TData extends RowData> {
        imagesListActions?: {
            setCarouselOpen: React.Dispatch<React.SetStateAction<boolean>>;
            setStartIndex: React.Dispatch<React.SetStateAction<number>>;
        };
        intl?: {
            formatter: ReturnType<typeof createFormatter>;
        };
    }
}