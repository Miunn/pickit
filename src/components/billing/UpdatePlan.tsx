import { useTranslations } from "next-intl";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "../ui/card";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { usePricingContext } from "@/context/PricingContext";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";
import { Plan } from "@prisma/client";
import { useState } from "react";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import CheckoutDialog from "./CheckoutDialog";
import { updateSubscription } from "@/actions/subscriptions";
import { Loader2 } from "lucide-react";
import { cancelStripeSubscription } from "@/actions/create";

const PlanCard = ({ selected, isCurrentPlan, plan, name, price, currency, isYearly, features }: { selected: boolean, isCurrentPlan: boolean, plan: Plan, name: string, price: { monthly: number, yearly: number }, currency: string, isYearly: boolean, features: string[] }) => {
    const t = useTranslations("billing.dashboard");
    return (
        <Label htmlFor={plan} className={cn("relative flex items-center gap-3 border p-3 rounded-lg", selected && "border-primary")}>
            {isCurrentPlan && (
                <Badge className="rounded-full text-xs absolute top-0 right-4 -translate-y-1/2">
                    {t("currentPlan")}
                </Badge>
            )}
            <RadioGroupItem value={plan} id={plan} className="size-5" />

            <div className="flex flex-col gap-2">
                <p className="font-bold">{name}</p>
                <p className="text-xl">
                    {currency} {isYearly ? Number(price.yearly / 12).toFixed(2) : Number(price.monthly).toFixed(2)}
                    <span className="text-sm text-muted-foreground"> {t("byMonth")}</span>
                </p>
                <p className="text-sm text-muted-foreground">{features.join(", ")}</p>
            </div>
        </Label>
    )
}

export default function UpdatePlan({ currentPlan }: { currentPlan: Plan }) {
    const t = useTranslations("billing.dashboard");
    const { plans, getCurrencySymbol, getPriceId } = usePricingContext();

    const [selectedPlan, setSelectedPlan] = useState<Plan>(currentPlan);
    const [isYearly, setIsYearly] = useState(true);

    const [backToFree, setBackToFree] = useState(false);
    const [upgrade, setUpgrade] = useState(false);
    const [changePlan, setChangePlan] = useState(false);

    return (
        <Card className="h-auto flex flex-col items-start gap-1">
            <CardHeader>
                <CardTitle>{t("upgrade.title")}</CardTitle>
                <CardDescription>{t("upgrade.description")}</CardDescription>
            </CardHeader>
            <CardContent className="w-full flex flex-col">

                <div className="flex items-center gap-2 mb-1 self-end">
                    <Switch id="isYearly" checked={isYearly} onCheckedChange={setIsYearly} />
                    <Label htmlFor="isYearly">{isYearly ? t("upgrade.yearly") : t("upgrade.monthly")}</Label>
                </div>
                <RadioGroup value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as Plan)} className="space-y-2 mt-2">
                    {Object.values(plans).map((plan) => (
                        <PlanCard key={plan.plan} selected={plan.plan === selectedPlan} isCurrentPlan={plan.plan === currentPlan} currency={getCurrencySymbol()} isYearly={isYearly} {...plan} />
                    ))}
                </RadioGroup>

                {currentPlan === Plan.FREE ? (
                    <CheckoutDialog plan={selectedPlan}>
                        <Button className="w-full text-center mt-2" disabled={selectedPlan === currentPlan || upgrade}>
                            {t("upgrade.button")}
                        </Button>
                    </CheckoutDialog>
                ) : selectedPlan === Plan.FREE ? (
                    <Button className="w-full text-center mt-2" disabled={backToFree} onClick={async () => {
                        setBackToFree(true);
                        await cancelStripeSubscription();
                        setBackToFree(false);
                    }}>
                        {backToFree && <Loader2 className="w-4 h-4 animate-spin mr-2" />} {t("upgrade.backToFree")}
                    </Button>
                ) : (
                    <Button className="w-full text-center mt-2" disabled={selectedPlan === currentPlan || changePlan} onClick={async () => {
                        setChangePlan(true);
                        await updateSubscription(getPriceId(selectedPlan, isYearly ? "yearly" : "monthly"));
                        setChangePlan(false);
                    }}>
                        {t("upgrade.changePlan")}
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}