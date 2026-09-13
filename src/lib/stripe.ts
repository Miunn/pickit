import Stripe from "stripe";

function createStripe(): Stripe {
	const key = process.env.STRIPE_SECRET_KEY;
	if (!key) {
		throw new Error("STRIPE_SECRET_KEY is not set");
	}
	return new Stripe(key);
}

let client: Stripe | undefined;

export const stripe: Stripe = new Proxy({} as Stripe, {
	get(_target, prop) {
		client ??= createStripe();
		const value = Reflect.get(client, prop, client);
		return typeof value === "function" ? value.bind(client) : value;
	},
});
