// "use client";

// import { CheckoutProvider } from "@stripe/react-stripe-js";
// import { useMemo } from "react";
// import CheckoutForm from "@/components/CheckoutForm";
// import { loadStripe } from "@stripe/stripe-js";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { usePricingContext } from "@/context/PricingContext";
// import { Plan } from "@prisma/client";
// import { useTranslations } from "next-intl";

// const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// export default function CheckoutDialog({
// 	plan,
// 	children,
// 	open,
// 	onOpenChange,
// }: {
// 	readonly plan: Plan;
// 	readonly children?: React.ReactNode;
// 	readonly open?: boolean;
// 	readonly onOpenChange?: (open: boolean) => void;
// }) {
// 	const t = useTranslations("billing.checkoutDialog");
// 	const { getPriceId, selectedPeriod, plans } = usePricingContext();

// 	const clientSecretPromise = useMemo(async () => {
// 		const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/checkout`, {
// 			method: "POST",
// 			headers: {
// 				"Content-Type": "application/json",
// 			},
// 			body: JSON.stringify({ priceId: getPriceId(plan, selectedPeriod) }),
// 		});
// 		const data = await response.json();
// 		return data.clientSecret;
// 	}, [plan, getPriceId, selectedPeriod]);

// 	return (
// 		<Dialog open={open} onOpenChange={onOpenChange}>
// 			{children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
// 			<DialogContent className="max-w-2xl">
// 				<DialogHeader>
// 					<DialogTitle>{t("title", { plan: plans[plan].name })}</DialogTitle>
// 				</DialogHeader>
// 				<CheckoutProvider
// 					stripe={stripe}
// 					options={{
// 						fetchClientSecret: () => clientSecretPromise,
// 						elementsOptions: {
// 							appearance: {
// 								theme: "stripe",
// 								variables: {
// 									colorPrimary: "#1f7551",
// 								},
// 							},
// 						},
// 					}}
// 				>
// 					<CheckoutForm />
// 				</CheckoutProvider>
// 			</DialogContent>
// 		</Dialog>
// 	);
// }
