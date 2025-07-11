import { prisma } from "@/lib/prisma";
import { getLimitsFromPlan, getPlanFromString } from "@/lib/utils";
import { Plan } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return new NextResponse("No signature", { status: 400 });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(await request.text(), signature, process.env.STRIPE_SUBSCRIBE_WEBHOOK_SECRET!);
    } catch (error) {
        return new NextResponse("Invalid signature", { status: 400 });
    }

    if (event.type !== "checkout.session.completed") {
        return new NextResponse("Invalid event type", { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    const userId = event.data.object.metadata?.userId;
    const plan = getPlanFromString(event.data.object.metadata?.plan ?? Plan.FREE);
    const limits = getLimitsFromPlan(plan);

    if (!userId) {
        return new NextResponse("No user id", { status: 400 });
    }

    await prisma.user.update({
        where: { id: userId },
        data: {
            stripeCustomerId: subscription.customer?.toString(),
            stripeSubscriptionId: subscription.id,
            plan: plan,
            maxStorage: limits.storage,
            maxAlbums: limits.albums,
            maxSharingLinks: limits.sharingLinks,
        }
    })

    return new NextResponse("OK", { status: 200 });
}