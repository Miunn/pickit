import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslations, useFormatter } from "next-intl";
import { usePricingContext } from "@/context/PricingContext";
import { useSession } from "@/providers/SessionProvider";
import { Plan } from "@prisma/client";
import { updateSubscription } from "@/actions/subscriptions";
import { Gift, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ChangePlanDialog({
    open,
    setOpen,
    newPlan,
    nextAmount,
    isYearly,
}: {
    readonly open: boolean;
    readonly setOpen: (open: boolean) => void;
    readonly newPlan: Plan;
    readonly nextAmount: number;
    readonly isYearly: boolean;
}) {
    const t = useTranslations("billing.changePlanPreview");
    const formatter = useFormatter();
    const { user } = useSession();
    const { plans, getPlanPrice, getPriceId } = usePricingContext();
    const credits = nextAmount < 0 ? Math.abs(nextAmount) : 0;

    const [isLoading, setIsLoading] = useState(false);

    if (!user) {
        return null;
    }

    const handleChangePlan = async () => {
        setIsLoading(true);
        await updateSubscription(getPriceId(newPlan, isYearly ? "yearly" : "monthly"));
        setIsLoading(false);
        setOpen(false);
    };

    const getCreditsOrAmountText = () => {
        if (nextAmount < 0) {
            return (
                <span className="flex items-center gap-1">
                    0€{" "}
                    <span className="text-[#9b59b6] flex items-center">
                        (<Gift className="size-4" /> {t("freeCredits", { credits: Math.abs(nextAmount) })})
                    </span>
                </span>
            );
        }

        return <span>{nextAmount} €</span>;
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                </DialogHeader>

                <div className="h-[250px] w-full flex gap-4">
                    <div className="flex-1 flex flex-col justify-between items-end">
                        <Label className="text-end">{t("before.title")}</Label>
                        <Label className="text-end">{t("now.title")}</Label>
                        <Label className="text-end">
                            {formatter.dateTime(
                                isYearly
                                    ? new Date().setFullYear(new Date().getFullYear() + 1)
                                    : new Date().setMonth(new Date().getMonth() + 1),
                                { dateStyle: "long" }
                            )}
                        </Label>
                    </div>
                    <div className="flex flex-col justify-between items-center">
                        <div className="size-4 rounded-full border-primary border-4" />
                        <div className="flex-1 w-1 bg-gradient-to-b from-primary to-[#9b59b6]" />
                        <div className="size-4 rounded-full border-[#9b59b6] border-4" />
                        <div className="flex-1 w-1 bg-gradient-to-b from-[#9b59b6] to-[#f1c40f]" />
                        <div className="size-4 rounded-full border-[#f1c40f] border-4" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between items-start">
                        <Label>{plans[user.plan].name}</Label>
                        <Label>
                            {plans[newPlan].name} - {getCreditsOrAmountText()}
                        </Label>
                        <Label>
                            {plans[newPlan].name} - {Math.max(0, getPlanPrice(newPlan) - credits)}€
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleChangePlan} disabled={isLoading}>
                        {isLoading ? <Loader2 className="size-4 animate-spin" /> : t("changePlan")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
