'use server'

import { getCurrentSession } from "@/lib/session";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const getPreviewInvoiceBeforeUpdate = async (priceId: string) => {
    const { user } = await getCurrentSession();

    if (!user || !user.stripeSubscriptionId) {
        return {
            status: "error",
            message: "User or subscription not found"
        };
    }

    const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    if (subscription.status === "incomplete_expired") {
        return {
            status: "error",
            message: "Subscription is incomplete"
        }
    }
    
    const invoice = await stripe.invoices.createPreview({
        subscription: subscription.id,
        subscription_details: {
            items: [
                {
                    id: subscription.items.data[0].id,
                    price: priceId
                }
            ],
            proration_behavior: "always_invoice",
            billing_cycle_anchor: "now",
            proration_date: Math.floor(Date.now() / 1000)
        }
    });

    return {
        status: "ok",
        nextAmount: invoice.lines.data[0].amount / 100
    }
}

export const updateSubscription = async (priceId: string) => {
    const { user } = await getCurrentSession();

    if (!user) {
        return {
            status: "error",
            message: "User not found"
        };
    }

    if (!user.stripeSubscriptionId) {
        return {
            status: "error",
            message: "Subscription not found"
        };
    }

    const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);;

    if (subscription.status === "incomplete_expired") {
        return {
            status: "error",
            message: "Subscription is incomplete"
        }
    }

    await stripe.subscriptions.update(subscription.id, {
        items: [
            {
                id: subscription.items.data[0].id,
                price: priceId
            }
        ],
        proration_behavior: "create_prorations",
        billing_cycle_anchor: "now"
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