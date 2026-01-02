import { UserService } from "@/data/user-service";
import { stripe } from "@/lib/stripe";
import { getLimitsFromPlan } from "@/lib/utils";
import { Plan } from "@prisma/client";
import { NextRequest } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return new Response("No signature", { status: 400 });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            await request.text(),
            signature,
            process.env.STRIPE_SUBSCRIBE_WEBHOOK_SECRET!
        );
    } catch {
        return new Response("Invalid signature", { status: 400 });
    }

    if (event.type !== "customer.subscription.deleted") {
        return new Response("Invalid event type", { status: 400 });
    }

    const subscription: Stripe.Subscription = event.data.object;

    const userId = subscription.metadata.userId;
    const limits = getLimitsFromPlan(Plan.FREE);

    await UserService.update(userId, {
        stripeSubscriptionId: null,
        plan: Plan.FREE,
        maxStorage: limits.storage,
        maxAlbums: limits.albums,
        maxSharingLinks: limits.sharingLinks,
    });
}
