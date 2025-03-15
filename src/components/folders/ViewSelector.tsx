'use client'

import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { LayoutGrid, List } from "lucide-react";

export enum ViewState {
    Grid = "grid",
    List = "list"
}

export default function ViewSelector({ viewState, setViewState }: { viewState: ViewState, setViewState: React.Dispatch<React.SetStateAction<ViewState>> }) {

    const t = useTranslations("components.viewSelector");

    return (
        <Select onValueChange={(value) => {
            switch (value) {
                case ViewState.Grid:
                    setViewState(ViewState.Grid);
                    break;
                case ViewState.List:
                    setViewState(ViewState.List);
                    break;
            }
        }} value={viewState}>
            <SelectTrigger className="w-28 font-medium hover:bg-accent hover:text-accent-foreground">
                <SelectValue placeholder={t('placeholder')} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ViewState.Grid}><div className="flex items-center gap-3"><LayoutGrid className="w-4 h-4" /> {t('options.grid')}</div></SelectItem>
                <SelectItem value={ViewState.List}><div className="flex items-center gap-3"><List className="w-4 h-4" /> {t('options.list')}</div></SelectItem>
            </SelectContent>
        </Select>
    )
}