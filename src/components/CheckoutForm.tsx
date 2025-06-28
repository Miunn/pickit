'use client'

import { CheckoutContextValue, PaymentElement, useCheckout } from "@stripe/react-stripe-js"
import { useState } from "react";

const validateEmail = async (email: string, checkout: CheckoutContextValue) => {
    const updateResult = await checkout.updateEmail(email);
    const isValid = updateResult.type !== "error";

    return { isValid, message: !isValid ? updateResult.error.message : null };
}

const EmailInput = ({ email, setEmail, error, setError }: { email: string, setEmail: (email: string) => void, error: string | null, setError: React.Dispatch<React.SetStateAction<string | null>>}) => {
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
            <label>
                Email
                <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="you@example.com"
                />
            </label>
            {error && <div id="email-errors">{error}</div>}
        </>
    );
};

export default function CheckoutForm() {
    const checkout = useCheckout();

    const [email, setEmail] = useState("");
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
        <div>
            <h1>Checkout Form</h1>
            <form onSubmit={handleSubmit}>
      <EmailInput
        email={email}
        setEmail={setEmail}
        error={emailError}
        setError={setEmailError}
      />
      <h4>Payment</h4>
      <PaymentElement id="payment-element" />
      <button disabled={isLoading} id="submit">
        {isLoading ? (
          <div className="spinner"></div>
        ) : (
          `Pay ${checkout.total.total.amount} now`
        )}
      </button>
      {/* Show any error or success messages */}
      {message && <div id="payment-message">{message}</div>}
    </form>
        </div>
    )
}