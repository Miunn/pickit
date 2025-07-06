'use client'

import { CheckoutProvider } from "@stripe/react-stripe-js";
import { useMemo } from "react";
import CheckoutForm from "../CheckoutForm";
import { loadStripe } from "@stripe/stripe-js";

const stripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function Checkout() {
    const clientSecretPromise = useMemo(() => {
        return fetch("/api/stripe/checkout", {
            method: "POST",
            body: JSON.stringify({
                priceId: process.env.NEXT_PUBLIC_PRICING_PRO_MONTHLY,
            }),
        })
            .then((res) => res.json())
            .then((data) => data.clientSecret);
    }, []);

    return (
        <CheckoutProvider
            stripe={stripe}
            options={{
                fetchClientSecret: () => clientSecretPromise,
                elementsOptions: {
                    appearance: {
                        theme: 'stripe',
                        variables: {
                            colorPrimary: '#1f7551',
                        }
                    }
                },
            }}>
            <CheckoutForm />
        </CheckoutProvider>
    )
}