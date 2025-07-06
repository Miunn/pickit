'use client'

import { createContext, useContext, useState } from "react";

type PricingContextType = {
    selectedPeriod: "monthly" | "yearly";
    setSelectedPeriod: (period: "monthly" | "yearly") => void;
    getPlanPrice: (plan: PricingPlan) => number;
    getCurrencySymbol: () => string;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export enum PricingPlan {
    FREE = "free",
    EFFICIENT = "efficient",
    PRO = "pro"
}

export enum SupportedCurrency {
    USD = "USD",
    EUR = "EUR"
}

const plans = {
    [PricingPlan.FREE]: {
        monthly: 0,
        yearly: 0,
    },
    [PricingPlan.EFFICIENT]: {
        monthly: 10,
        yearly: 100,
    },
    [PricingPlan.PRO]: {
        monthly: 20,
        yearly: 180,
    }
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

    const getPlanPrice = (plan: PricingPlan) => {
        return plans[plan][selectedPeriod];
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
        <PricingContext.Provider value={{ selectedPeriod, setSelectedPeriod, getPlanPrice, getCurrencySymbol }}>
            {children}
        </PricingContext.Provider>
    )
}