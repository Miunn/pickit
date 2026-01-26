import { NextResponse } from "next/server";
import { getCurrentSession } from "@/data/session";
import { stripe } from "@/lib/stripe";

export async function GET() {
	const { user } = await getCurrentSession();

	if (!user) {
		console.log("No user, unauthorized");
		return new Response("Unauthorized", { status: 401 });
	}

	if (!user.stripeCustomerId) {
		return new Response("No stripe customer id", { status: 400 });
	}

	const payments = await stripe.paymentIntents.list({
		customer: user.stripeCustomerId,
	});

	console.log(payments.data);

	return NextResponse.json(
		payments.data.map(payment => ({
			amount: payment.amount / 100,
			currency: payment.currency,
			status: "DONE",
			date: new Date(payment.created * 1000),
		}))
	);
}
