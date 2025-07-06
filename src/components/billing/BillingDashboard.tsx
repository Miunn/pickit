'use client'

import { useTranslations } from "next-intl";
import { Progress } from "../ui/progress";
import { useSession } from "@/providers/SessionProvider";
import { formatBytes } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export default function BillingDashboard() {
    const t = useTranslations("billing.dashboard");

    const { user } = useSession();

    const formattedUsedStorage = formatBytes(Number(user?.usedStorage));
    const formattedMaxStorage = formatBytes(Number(user?.maxStorage));
    const usedStoragePercentage = Number(user?.usedStorage) / Number(user?.maxStorage) * 100;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <div className="flex flex-col gap-4">
            <Card>
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

            <Card>
                <CardHeader>
                    <CardTitle>{t("myplan.title", { used: formattedUsedStorage, max: formattedMaxStorage })}</CardTitle>
                </CardHeader>
                <CardContent className="w-full">
                    
                </CardContent>
            </Card>
            </div>

            <div className="flex flex-col gap-4">
            <Card className="h-auto flex flex-col items-start gap-1">
                <CardHeader>
                    <CardTitle>{t("upgrade.title")}</CardTitle>
                    <CardDescription>{t("upgrade.description")}</CardDescription>
                </CardHeader>
                <CardContent className="w-full">
                    
                </CardContent>
            </Card>
            </div>
        </div>
    )
}