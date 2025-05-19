'use client'

import { NumberTicker } from "@/components/magicui/number-ticker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PricingPlan, usePricingContext } from "@/context/PricingContext";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";

const PricingCard = ({ title, description, price, features, selectedPeriod }: { title: string, description: string, price: number, features: string[], selectedPeriod: "monthly" | "yearly" }) => {
    const t = useTranslations("pages.pricing");
    const { getCurrencySymbol } = usePricingContext();
    return (
        <Card className="shadow-lg w-96">
            <CardHeader className="h-32">
                <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                <CardDescription className="text-muted-foreground">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="mb-4"><span className="text-3xl font-bold"><NumberTicker value={price} />{getCurrencySymbol()}</span> <span className="text-muted-foreground">{selectedPeriod === "monthly" ? t("monthly") : t("yearly")}</span></p>
                <Button variant="outline" className="w-full mb-4">{t("getStarted")}</Button>
                <ul className="space-y-2">
                    {features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2"><CheckIcon className="bg-primary rounded-full p-0.5 text-white" /> {feature}</li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}

export default function PricingPage() {
    const t = useTranslations("pages.pricing");
    const { selectedPeriod, setSelectedPeriod, getPlanPrice } = usePricingContext();

    const cards = [
        {
            plan: PricingPlan.FREE,
            title: t("cards.free.title"),
            description: t("cards.free.description"),
            features: [
                t("cards.free.features.0"),
                t("cards.free.features.1"),
                t("cards.free.features.2"),
            ],
        },
        {
            plan: PricingPlan.EFFICIENT,
            title: t("cards.efficient.title"),
            description: t("cards.efficient.description"),
            features: [
                t("cards.efficient.features.0"),
                t("cards.efficient.features.1"),
                t("cards.efficient.features.2"),
                t("cards.efficient.features.3"),
                t("cards.efficient.features.4"),
            ],
        },
        {
            plan: PricingPlan.PRO,
            title: t("cards.pro.title"),
            description: t("cards.pro.description"),
            features: [
                t("cards.pro.features.0"),
                t("cards.pro.features.1"),
                t("cards.pro.features.2"),
                t("cards.pro.features.3"),
            ],
        }
    ]

    return (
        <div className="max-w-7xl mx-auto mt-24">
            <h1 className="text-4xl font-bold text-center">{t("title")}</h1>
            <p className="text-base text-muted-foreground text-center">{t("description")}</p>

            <div className="flex items-center justify-center gap-2 my-12">
                <Label htmlFor="period">{t("monthlyLabel")}</Label>
                <Switch id="period" checked={selectedPeriod === "yearly"} onCheckedChange={() => setSelectedPeriod(selectedPeriod === "monthly" ? "yearly" : "monthly")} />
                <Label htmlFor="period">{t("yearlyLabel")}</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 content-center">
                {cards.map((card) => (
                    <Fragment key={card.title}>
                        <PricingCard price={getPlanPrice(card.plan)} selectedPeriod={selectedPeriod} {...card} />
                    </Fragment>
                ))}
            </div>
        </div>
    )
}
