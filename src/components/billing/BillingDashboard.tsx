'use client'

import { useTranslations } from "next-intl";
import { Progress } from "../ui/progress";
import { useSession } from "@/providers/SessionProvider";
import { formatBytes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import UpdatePlan from "./UpdatePlan";
import { Plan } from "@prisma/client";
import { DataTable } from "../ui/data-table";
import { historyColumns } from "./history-columns";
import useBillingHistorySWR from "@/hooks/useBillingHistory";

export default function BillingDashboard() {
    const t = useTranslations("billing.dashboard");

    const { user } = useSession();
    const { data: history, isLoading: isLoadingHistory } = useBillingHistorySWR();

    const formattedUsedStorage = formatBytes(Number(user?.usedStorage));
    const formattedMaxStorage = formatBytes(Number(user?.maxStorage));
    const usedStoragePercentage = Number(user?.usedStorage) / Number(user?.maxStorage) * 100;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-4">
                    <Card className="flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle>{t('storage.using', { used: formattedUsedStorage, max: formattedMaxStorage })}</CardTitle>
                        </CardHeader>
                        <CardContent className="w-full">
                            <div className="w-full flex items-center gap-2">
                                <Progress value={usedStoragePercentage} className="w-full" />
                                <span className="text-nowrap text-sm text-muted-foreground">{formattedUsedStorage} / {formattedMaxStorage} ({usedStoragePercentage.toFixed(2)}%)</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle>{t("albums.using", { used: user?._count.folders, max: user?.maxAlbums })}</CardTitle>
                        </CardHeader>
                        <CardContent className="w-full">
                            <div className="w-full flex items-center gap-2">
                                <Progress value={user?._count.folders ? user?._count.folders / user?.maxAlbums * 100 : 0} className="w-full" />
                                <span className="text-nowrap text-sm text-muted-foreground">{user?._count.folders} / {user?.maxAlbums}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="flex flex-col justify-between">
                        <CardHeader>
                            <CardTitle>{t("sharing.using", { used: user?._count.folders, max: user?.maxSharingLinks })}</CardTitle>
                        </CardHeader>
                        <CardContent className="w-full">
                            <div className="w-full flex items-center gap-2">
                                <Progress value={user?._count.folders ? user?._count.folders / user?.maxSharingLinks * 100 : 0} className="w-full" />
                                <span className="text-nowrap text-sm text-muted-foreground">{user?._count.folders} / {user?.maxSharingLinks}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <DataTable
                    columns={historyColumns}
                    data={history ?? []}
                    selection={{}}
                    setSelection={() => {}}
                    filterPlaceholder="Search history"
                    filterColumn="date"
                    hideHeader
                />
            </div>

            <div className="flex flex-col gap-4">
                <UpdatePlan currentPlan={user?.plan ?? Plan.FREE} />
            </div>
        </div>
    )
}