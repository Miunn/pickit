"use server";

import {prisma} from "@/lib/prisma";
import {ActionResult, SignupFormSchema} from "@/lib/definitions";
import * as bcrypt from 'bcryptjs';
import { z } from "zod";
import { Plan, Prisma } from "@prisma/client";
import { addDays } from "date-fns";
import Stripe from "stripe";
import { getCurrentSession } from "@/lib/session";
import { getLimitsFromPlan } from "@/lib/utils";
import { revalidatePath } from "next/cache";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createUserHandler({name, email, password, passwordConfirmation}: z.infer<typeof SignupFormSchema>): Promise<ActionResult> {
    let errors = [];

    try {
        SignupFormSchema.safeParse({email, password, passwordConfirmation: password});
    } catch (e: any) {
        errors.push(e.message);
        return {
            status: 'error',
            message: e.message
        };
    }

    if (password !== passwordConfirmation) {
        return {
            status: 'error',
            message: "Passwords don't match"
        };
    }

    try {
        const salt = bcrypt.genSaltSync(10)
        const hashedPassword = bcrypt.hashSync(password, salt);
        const verificationToken = crypto.randomUUID();
        const user = await prisma.user.create({
            data: {
                name: name,
                email: email,
                emailVerificationDeadline: addDays(new Date(), 7),
                password: hashedPassword,
                verifiedEmailRequest: {
                    create: {
                        token: verificationToken,
                        expires: addDays(new Date(), 7)
                    }
                }
            },
        });

        await createStripeCustomer();

        return {
            status: 'ok'
        };
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            return {
                status: "error",
                message: "An account with the same email already exists"
            }
        }

        return {
            status: "error",
            message: "An unknown error happened while creating your account"
        }
    }
}


export const createStripeCustomer = async (): Promise<string> => {
    const { user } = await getCurrentSession();

    if (!user) {
        throw new Error("Unauthorized");
    }

    const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
    });

    await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id }
    });

    return customer.id;
}

export const createStripeSubscription = async (priceId: string): Promise<Stripe.Subscription> => {
    const { user } = await getCurrentSession();

    if (!user) {
        throw new Error("Unauthorized");
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
        customerId = await createStripeCustomer();
    }

    if (user.stripeSubscriptionId) {
        await cancelStripeSubscription();
    }

    const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.confirmation_secret'],
        automatic_tax: { enabled: true },
        metadata: { userId: user.id }
    });

    await prisma.user.update({
        where: { id: user.id },
        data: { stripeSubscriptionId: subscription.id }
    });

    return subscription;
}

export const cancelStripeSubscription = async (): Promise<void> => {
    const { user } = await getCurrentSession();

    if (!user) {
        throw new Error("Unauthorized");
    }

    if (!user.stripeSubscriptionId) {
        throw new Error("No subscription found");
    }

    try {
        await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (e) {
        console.error(e);
    }

    const limits = getLimitsFromPlan(Plan.FREE);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            stripeSubscriptionId: null,
            plan: Plan.FREE,
            maxStorage: limits.storage,
            maxAlbums: limits.albums,
            maxSharingLinks: limits.sharingLinks
        }
    });

    revalidatePath("/app/account/billing");
}