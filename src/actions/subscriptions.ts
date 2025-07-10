'use server'

import { getCurrentSession } from "@/lib/session";
import Stripe from "stripe";
import { createStripeSubscription } from "./create";
import { revalidatePath } from "next/cache";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const updateSubscription = async (priceId: string) => {
    const { user } = await getCurrentSession();

    if (!user) {
        return {
            status: "error",
            message: "User not found"
        };
    }

    let subscription: Stripe.Subscription;

    if (!user.stripeSubscriptionId) {
        subscription = await createStripeSubscription(priceId);
    } else {
        subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    }

    if (subscription.status === "incomplete_expired") {
        subscription = await createStripeSubscription(priceId);
    }

    await stripe.subscriptions.update(subscription.id, {
        items: [
            {
                id: subscription.items.data[0].id,
                price: priceId
            }
        ]
    });

    if (subscription.pending_setup_intent !== null) {
        return {
            status: 'ok',
            type: 'setup',
        };
    }

    revalidatePath("/app/account/billing");
    
    return {
        status: 'ok',
        type: 'payment',
    };
}