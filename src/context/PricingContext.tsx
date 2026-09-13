"use client";

import { ButtonProps } from "@/components/ui/button";
import { Plan } from "@prisma/client";
import { useTranslations } from "next-intl";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

type PricingContextType = {
	selectedPeriod: "monthly" | "yearly";
	setSelectedPeriod: (period: "monthly" | "yearly") => void;
	getPlanPrice: (plan: Plan) => number;
	getCurrencySymbol: () => string;
	plans: Record<Plan, PricingPlan>;
	getPriceId: (plan: Plan, period: "monthly" | "yearly") => string;
};

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export type PricingPlan = {
	plan: Plan;
	priceId: { monthly: string; yearly: string };
	name: string;
	price: { monthly: number; yearly: number };
	ctaVariant: ButtonProps["variant"];
	description: string;
	features: string[];
};

export enum SupportedCurrency {
	USD = "USD",
	EUR = "EUR",
}

export const usePricingContext = () => {
	const context = useContext(PricingContext);

	if (!context) {
		throw new Error("usePricingContext must be used within a PricingProvider");
	}

	return context;
};

export const PricingProvider = ({ children }: { readonly children: React.ReactNode }) => {
	const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "yearly">("yearly");

	const t = useTranslations("pages.pricing");

	const plans: Record<Plan, PricingPlan> = useMemo(
		() => ({
			[Plan.FREE]: {
				plan: Plan.FREE,
				priceId: {
					monthly: process.env.NEXT_PUBLIC_PRICING_FREE_MONTHLY!,
					yearly: process.env.NEXT_PUBLIC_PRICING_FREE_YEARLY!,
				},
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
				priceId: {
					monthly: process.env.NEXT_PUBLIC_PRICING_EFFICIENT_MONTHLY!,
					yearly: process.env.NEXT_PUBLIC_PRICING_EFFICIENT_YEARLY!,
				},
				name: t("cards.efficient.title"),
				price: { monthly: 5, yearly: 50 },
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
				priceId: {
					monthly: process.env.NEXT_PUBLIC_PRICING_PRO_MONTHLY!,
					yearly: process.env.NEXT_PUBLIC_PRICING_PRO_YEARLY!,
				},
				name: t("cards.pro.title"),
				price: { monthly: 10, yearly: 100 },
				description: t("cards.pro.description"),
				ctaVariant: "outline",
				features: [
					t("cards.pro.features.0"),
					t("cards.pro.features.1"),
					t("cards.pro.features.2"),
					t("cards.pro.features.3"),
				],
			},
		}),
		[t]
	);

	const getPlanPrice = useCallback(
		(plan: Plan) => {
			return plans[plan].price[selectedPeriod];
		},
		[plans, selectedPeriod]
	);

	const getPriceId = useCallback(
		(plan: Plan, period: "monthly" | "yearly") => {
			return plans[plan].priceId[period];
		},
		[plans]
	);

	const getCurrencySymbol = () => {
		return "€";
	};

	const providerValue = useMemo(
		() => ({
			selectedPeriod,
			setSelectedPeriod,
			getPlanPrice,
			getCurrencySymbol,
			plans,
			getPriceId,
		}),
		[selectedPeriod, plans, getPlanPrice, getPriceId]
	);

	return <PricingContext.Provider value={providerValue}>{children}</PricingContext.Provider>;
};
