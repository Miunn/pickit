'use client'

import { ButtonProps } from "@/components/ui/button";
import { Plan } from "@prisma/client";
import { useTranslations } from "next-intl";
import { createContext, useContext, useState } from "react";

type PricingContextType = {
    selectedPeriod: "monthly" | "yearly";
    setSelectedPeriod: (period: "monthly" | "yearly") => void;
    getPlanPrice: (plan: Plan) => number;
    getCurrencySymbol: () => string;
    plans: Record<Plan, PricingPlan>;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export type PricingPlan = {
    plan: Plan;
    name: string;
    price: { monthly: number, yearly: number };
    ctaVariant: ButtonProps["variant"];
    description: string;
    features: string[];
}

export enum SupportedCurrency {
    USD = "USD",
    EUR = "EUR"
}

export const usePricingContext = () => {
    const context = useContext(PricingContext);

    if (!context) {
        throw new Error("usePricingContext must be used within a PricingProvider");
    }

    return context;
}

export const PricingProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "yearly">("yearly");
    const [currency, setCurrency] = useState<SupportedCurrency>(SupportedCurrency.USD);

    const t = useTranslations("pages.pricing");

    const plans: Record<Plan, PricingPlan> = {
        [Plan.FREE]: {
            plan: Plan.FREE,
            name: t("cards.free.title"),
            price: { monthly: 0, yearly: 0 },
            description: t("cards.free.description"),
            ctaVariant: "outline",
            features: [
                t("cards.free.features.0"),
                t("cards.free.features.1"),
                t("cards.free.features.2"),
            ],
        },
        [Plan.EFFICIENT]: {
            plan: Plan.EFFICIENT,
            name: t("cards.efficient.title"),
            price: { monthly: 10, yearly: 100 },
            description: t("cards.efficient.description"),
            ctaVariant: "default",
            features: [
                t("cards.efficient.features.0"),
                t("cards.efficient.features.1"),
                t("cards.efficient.features.2"),
                t("cards.efficient.features.3"),
                t("cards.efficient.features.4"),
            ],
        },
        [Plan.PRO]: {
            plan: Plan.PRO,
            name: t("cards.pro.title"),
            price: { monthly: 20, yearly: 180 },
            description: t("cards.pro.description"),
            ctaVariant: "outline",
            features: [
                t("cards.pro.features.0"),
                t("cards.pro.features.1"),
                t("cards.pro.features.2"),
                t("cards.pro.features.3"),
            ],
        }
    }

    const getPlanPrice = (plan: Plan) => {
        return plans[plan].price[selectedPeriod];
    }

    const getCurrencySymbol = () => {
        switch (currency) {
            case SupportedCurrency.USD:
                return "$";
            case SupportedCurrency.EUR:
                return "€";
        }
    }

    return (
        <PricingContext.Provider value={{ selectedPeriod, setSelectedPeriod, getPlanPrice, getCurrencySymbol, plans }}>
            {children}
        </PricingContext.Provider>
    )
}