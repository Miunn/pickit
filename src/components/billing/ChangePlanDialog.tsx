import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useTranslations } from "next-intl";
import { usePricingContext } from "@/context/PricingContext";
import { useSession } from "@/providers/SessionProvider";
import { Plan } from "@prisma/client";
import { useFormatter } from "next-intl";
import { updateSubscription } from "@/actions/subscriptions";

export default function ChangePlanDialog({ open, setOpen, newPlan, nextAmount, isYearly }: { open: boolean, setOpen: (open: boolean) => void, newPlan: Plan, nextAmount: number, isYearly: boolean }) {
    const t = useTranslations("billing.changePlanPreview");
    const formatter = useFormatter();
    const { user } = useSession();
    const { plans, getPlanPrice, getPriceId } = usePricingContext();
    
    if (!user) {
        return null;
    }

    const handleChangePlan = async () => {
        setOpen(false);
        await updateSubscription(getPriceId(newPlan, isYearly ? "yearly" : "monthly"));
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                    <div>
                        <p>{t("before.title")}</p>
                        <p>{plans[user.plan].name}</p>
                    </div>
                    <div>
                        <p>{t("now.title")}</p>
                        <p>{plans[newPlan].name} ({nextAmount})</p>
                    </div>
                    <div>
                        <p>{formatter.dateTime(isYearly ? new Date().setFullYear(new Date().getFullYear() + 1) : new Date().setMonth(new Date().getMonth() + 1), { dateStyle: "long" })}</p>
                        <p>{plans[newPlan].name} {getPlanPrice(newPlan)}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}