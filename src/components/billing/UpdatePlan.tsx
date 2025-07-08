import { useTranslations } from "next-intl";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "../ui/card";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { usePricingContext } from "@/context/PricingContext";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";
import { Plan } from "@prisma/client";
import { useState } from "react";
import { CheckIcon } from "lucide-react";
import { Badge } from "../ui/badge";

const PlanCard = ({ selected, isCurrentPlan, plan, name, price, features }: { selected: boolean, isCurrentPlan: boolean, plan: Plan, name: string, price: { monthly: number, yearly: number }, features: string[] }) => {
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
                <p className="text-lg font-bold">{name}</p>
                <p className="text-sm text-muted-foreground">{price.monthly}</p>
                <p className="text-sm text-muted-foreground">{price.yearly}</p>
                <p className="text-sm text-muted-foreground">{features.join(", ")}</p>
            </div>
        </Label>
    )
}

export default function UpdatePlan({ currentPlan }: { currentPlan: Plan }) {
    const t = useTranslations("billing.dashboard");
    const { plans } = usePricingContext();

    const [selectedPlan, setSelectedPlan] = useState<Plan>(currentPlan);

    return (
        <Card className="h-auto flex flex-col items-start gap-1">
            <CardHeader>
                <CardTitle>{t("upgrade.title")}</CardTitle>
                <CardDescription>{t("upgrade.description")}</CardDescription>
            </CardHeader>
            <CardContent className="w-full">
                <RadioGroup value={selectedPlan} onValueChange={(value) => setSelectedPlan(value as Plan)}>
                    {Object.values(plans).map((plan) => (
                        <PlanCard key={plan.plan} selected={plan.plan === selectedPlan} isCurrentPlan={plan.plan === currentPlan} {...plan} />
                    ))}
                </RadioGroup>
            </CardContent>
        </Card>
    )
}