import { getCurrentSession } from "@/lib/session";
import { getPlanFromPriceId } from "@/lib/utils";
import { Plan } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
    const { user } = await getCurrentSession();

    if (!user) {
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
        customer_email: user.email,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/account/billing?session_id={CHECKOUT_SESSION_ID}`,
        metadata: { userId: user.id, plan: getPlanFromPriceId(priceId) ?? Plan.FREE },
        automatic_tax: { enabled: true }
    });

    return NextResponse.json({ clientSecret: session.client_secret });
}