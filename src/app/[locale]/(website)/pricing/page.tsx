"use client";

import { NumberTicker } from "@/components/ui/number-ticker";
import { Button, ButtonProps } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePricingContext } from "@/context/PricingContext";
import { Link } from "@/i18n/navigation";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";

const PricingCard = ({
    name,
    description,
    price,
    features,
    selectedPeriod,
    ctaVariant,
}: {
    readonly name: string;
    readonly description: string;
    readonly price: { monthly: number; yearly: number };
    readonly features: string[];
    readonly selectedPeriod: "monthly" | "yearly";
    readonly ctaVariant: ButtonProps["variant"];
}) => {
    const t = useTranslations("pages.pricing");
    const { getCurrencySymbol } = usePricingContext();
    return (
        <Card className="shadow-lg w-96">
            <CardHeader className="h-32">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold">{name}</CardTitle>
                    {selectedPeriod === "yearly" && (
                        <span className="text-muted-foreground text-xs">{t("billedYearly")}</span>
                    )}
                </div>
                <CardDescription className="text-muted-foreground">{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="mb-4">
                    <span className="text-3xl font-bold">
                        <NumberTicker value={selectedPeriod === "monthly" ? price.monthly : price.yearly / 12} />
                        {getCurrencySymbol()}
                    </span>{" "}
                    <span className="text-muted-foreground">{t("monthly")}</span>
                </p>
                <Button variant={ctaVariant} className="w-full mb-4" asChild>
                    <Link href="/signin?side=register">{t("getStarted")}</Link>
                </Button>
                <ul className="space-y-2">
                    {features.map(feature => (
                        <li key={feature} className="flex items-center gap-2">
                            <CheckIcon className="bg-primary rounded-full p-0.5 text-white" /> {feature}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

export default function PricingPage() {
    const t = useTranslations("pages.pricing");
    const { selectedPeriod, setSelectedPeriod, plans } = usePricingContext();

    return (
        <div className="max-w-7xl mx-auto mt-24">
            <h1 className="text-4xl font-bold text-center">{t("title")}</h1>
            <p className="text-base text-muted-foreground text-center">{t("description")}</p>

            <div className="flex items-center justify-center gap-2 my-12">
                <Label htmlFor="period">{t("monthlyLabel")}</Label>
                <Switch
                    id="period"
                    checked={selectedPeriod === "yearly"}
                    onCheckedChange={() => setSelectedPeriod(selectedPeriod === "monthly" ? "yearly" : "monthly")}
                />
                <Label htmlFor="period">{t("yearlyLabel")}</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 content-center">
                {Object.entries(plans).map(([plan, value]) => (
                    <Fragment key={plan}>
                        <PricingCard selectedPeriod={selectedPeriod} {...value} />
                    </Fragment>
                ))}
            </div>
        </div>
    );
}
