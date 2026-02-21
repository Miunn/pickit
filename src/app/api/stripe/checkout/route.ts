import { AuthService } from "@/data/secure/auth";
import { stripe } from "@/lib/stripe";
import { getPlanFromPriceId } from "@/lib/utils";
import { Plan } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	const { isAuthenticated, session: userSession } = await AuthService.isAuthenticated();

	if (!isAuthenticated || !userSession) {
		console.log("No user, unauthorized");
		return new Response("Unauthorized", { status: 401 });
	}

	const { priceId } = await request.json();

	const session = await stripe.checkout.sessions.create({
		ui_mode: "custom",
		line_items: [
			{
				price: priceId,
				quantity: 1,
			},
		],
		mode: "subscription",
		customer_email: userSession.user.email,
		return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/account/billing?session_id={CHECKOUT_SESSION_ID}`,
		metadata: { userId: userSession.user.id, plan: getPlanFromPriceId(priceId) ?? Plan.FREE },
		automatic_tax: { enabled: true },
	});

	return NextResponse.json({ clientSecret: session.client_secret });
}
