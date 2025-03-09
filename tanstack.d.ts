import '@tanstack/table-core';

declare module '@tanstack/table-core' {
    export interface TableMeta<TData extends RowData> {
        imagesListActions?: {
            setCarouselOpen: React.Dispatch<React.SetStateAction<boolean>>;
            setStartIndex: React.Dispatch<React.SetStateAction<number>>;
        };
    }
}