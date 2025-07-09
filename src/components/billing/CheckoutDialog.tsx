'use client'

import { CheckoutProvider } from "@stripe/react-stripe-js";
import { useMemo } from "react";
import CheckoutForm from "../CheckoutForm";
import { loadStripe } from "@stripe/stripe-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { usePricingContext } from "@/context/PricingContext";
import { Plan } from "@prisma/client";
import { useTranslations } from "next-intl";

const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutDialog({ plan, children, open, onOpenChange }: { plan: Plan, children?: React.ReactNode, open?: boolean, onOpenChange?: (open: boolean) => void }) {
    const t = useTranslations("billing.checkoutDialog");
    const { getPriceId, selectedPeriod, plans } = usePricingContext();

    const clientSecretPromise = useMemo(async () => {
        const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            body: JSON.stringify({
                priceId: getPriceId(plan, selectedPeriod),
            }),
        });
        const data = await res.json();
        return data.clientSecret;
    }, [getPriceId, plan, selectedPeriod]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children ?
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
                : null}
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t("title", { plan: plans[plan].name })}</DialogTitle>
                </DialogHeader>
                <CheckoutProvider
                    stripe={stripe}
                    options={{
                        fetchClientSecret: () => clientSecretPromise,
                        elementsOptions: {
                            appearance: {
                                theme: 'stripe',
                                variables: {
                                    colorPrimary: '#1f7551',
                                }
                            }
                        },
                    }}>
                    <CheckoutForm />
                </CheckoutProvider>
            </DialogContent>
        </Dialog>
    )
}