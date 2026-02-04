"use server";

// import { ActionResult, SignupFormSchema } from "@/lib/definitions";
// import * as bcrypt from "bcryptjs";
// import { z } from "zod";
// import { Plan, Prisma } from "@prisma/client";
// import { addDays } from "date-fns";
// import Stripe from "stripe";
// import { getLimitsFromPlan } from "@/lib/utils";
// import { revalidatePath } from "next/cache";
// import { UserService } from "@/data/user-service";
// import { stripe } from "@/lib/stripe";

// export const createStripeCustomer = async (): Promise<string> => {
// 	const { user } = await getCurrentSession();

// 	if (!user) {
// 		throw new Error("Unauthorized");
// 	}

// 	const customer = await stripe.customers.create({
// 		email: user.email,
// 		name: user.name,
// 	});

// 	await UserService.update(user.id, { stripeCustomerId: customer.id });

// 	return customer.id;
// };

// export const createStripeSubscription = async (priceId: string): Promise<Stripe.Subscription> => {
// 	const { user } = await getCurrentSession();

// 	if (!user) {
// 		throw new Error("Unauthorized");
// 	}

// 	let customerId = user.stripeCustomerId;

// 	if (!customerId) {
// 		customerId = await createStripeCustomer();
// 	}

// 	if (user.stripeSubscriptionId) {
// 		await cancelStripeSubscription();
// 	}

// 	const subscription = await stripe.subscriptions.create({
// 		customer: customerId,
// 		items: [{ price: priceId }],
// 		payment_behavior: "default_incomplete",
// 		payment_settings: { save_default_payment_method: "on_subscription" },
// 		expand: ["latest_invoice.confirmation_secret"],
// 		automatic_tax: { enabled: true },
// 		metadata: { userId: user.id },
// 	});

// 	await UserService.update(user.id, { stripeSubscriptionId: subscription.id });

// 	return subscription;
// };

// export const cancelStripeSubscription = async (): Promise<void> => {
// 	const { user } = await getCurrentSession();

// 	if (!user) {
// 		throw new Error("Unauthorized");
// 	}

// 	if (!user.stripeSubscriptionId) {
// 		throw new Error("No subscription found");
// 	}

// 	try {
// 		await stripe.subscriptions.update(user.stripeSubscriptionId, {
// 			cancel_at_period_end: true,
// 		});
// 	} catch (e) {
// 		console.error(e);
// 		throw new Error("Failed to cancel subscription");
// 	}

// 	const limits = getLimitsFromPlan(Plan.FREE);

// 	await UserService.update(user.id, {
// 		stripeSubscriptionId: null,
// 		plan: Plan.FREE,
// 		maxStorage: limits.storage,
// 		maxAlbums: limits.albums,
// 		maxSharingLinks: limits.sharingLinks,
// 	});

// 	revalidatePath("/app/account/billing");
// };
