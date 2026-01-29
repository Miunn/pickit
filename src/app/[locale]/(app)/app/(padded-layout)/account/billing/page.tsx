import BillingDashboard from "@/components/billing/BillingDashboard";
import { Separator } from "@/components/ui/separator";
import { redirect } from "@/i18n/navigation";
import { getCurrentSession } from "@/data/session";
import { getTranslations } from "next-intl/server";

export default async function BillingPage(props: { readonly params: Promise<{ locale: string }> }) {
	const params = await props.params;

	const { user } = await getCurrentSession();

	if (!user) {
		return redirect({ href: "/signin", locale: params.locale });
	}

	const t = await getTranslations("pages.billing");

	return (
		<div className="flex flex-col gap-1">
			<h3 className="font-semibold">{t("plan", { plan: user.plan.toString().toLowerCase() })}</h3>
			<p className="text-sm text-muted-foreground my-0">{t("subtitle")}</p>

			<Separator orientation="horizontal" className="my-6" />

			<BillingDashboard />
		</div>
	);
}
