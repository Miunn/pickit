'use client'

import { CheckoutContextValue, PaymentElement, useCheckout } from "@stripe/react-stripe-js"
import { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { useSession } from "@/providers/SessionProvider";

const validateEmail = async (email: string, checkout: CheckoutContextValue) => {
	const updateResult = await checkout.updateEmail(email);
	const isValid = updateResult.type !== "error";

	return { isValid, message: !isValid ? updateResult.error.message : null };
}

const EmailInput = ({ email, setEmail, error, setError, disabled }: { email: string, setEmail: (email: string) => void, error: string | null, setError: React.Dispatch<React.SetStateAction<string | null>>, disabled?: boolean }) => {
	const checkout = useCheckout();

	const handleBlur = async () => {
		if (!email) {
			return;
		}

		const { isValid, message } = await validateEmail(email, checkout);
		if (!isValid) {
			setError(message);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setError(null);
		setEmail(e.target.value);
	};

	return (
		<>
			<Label htmlFor="email" className="font-normal">Email</Label>
			<Input
					id="email"
					type="text"
					value={email}
					onChange={handleChange}
					onBlur={handleBlur}
					placeholder="you@example.com"
					disabled={disabled}
				/>
			{error && <div id="email-errors" className="text-destructive text-sm mt-1">{error}</div>}
		</>
	);
};

export default function CheckoutForm() {
	const checkout = useCheckout();
	const { user } = useSession();
	const [email, setEmail] = useState(user?.email || "");

	const [emailError, setEmailError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		setIsLoading(true);

		const { isValid, message } = await validateEmail(email, checkout);
		if (!isValid) {
			setEmailError(message);
			setMessage(message);
			setIsLoading(false);
			return;
		}

		const confirmResult = await checkout.confirm();

		// This point will only be reached if there is an immediate error when
		// confirming the payment. Otherwise, your customer will be redirected to
		// your `return_url`. For some payment methods like iDEAL, your customer will
		// be redirected to an intermediate site first to authorize the payment, then
		// redirected to the `return_url`.
		if (confirmResult.type === 'error') {
			setMessage(confirmResult.error.message);
		}

		setIsLoading(false);
	};

	return (
		<form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 space-y-2">
			<EmailInput
				email={email}
				setEmail={setEmail}
				error={emailError}
				setError={setEmailError}
				disabled={true}
			/>
			<PaymentElement id="payment-element" options={{
				layout: {
					type: 'tabs',
					defaultCollapsed: false,
				}
			}} />
			<Button disabled={isLoading} id="submit" className="w-full my-3">
				{isLoading ? (
					<Loader2 className="size-4 animate-spin" />
				) : (
					`Pay ${checkout.total.total.amount} now`
				)}
			</Button>
			{/* Show any error or success messages */}
			{message && <div id="payment-message" className="text-destructive text-sm">{message}</div>}
		</form>
	)
}