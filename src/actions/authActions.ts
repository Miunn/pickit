"use server";

import {signIn, signOut} from "@/actions/auth";
import { CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";

export async function SignIn({email, password, redirectUrl}: { email: string, password: string, redirectUrl: string }): Promise<{
    error: string
} | null> {

    if (!redirectUrl.startsWith(process.env.NEXTAUTH_URL!)) {
        return null;
    }

    try {
        return await signIn("credentials", { redirect: true, redirectTo: redirectUrl, email, password });
    } catch (e) {
        if (e instanceof CredentialsSignin) {
            return { error: "invalid-credentials" };
        }

        // Follow when its a NEXT_REDIRECT error
        redirect(redirectUrl);
    }
}

export async function SignOut(locale?: string) {
    return await signOut({ redirectTo: `/${locale || 'en'}/signin?callbackUrl=${process.env.NEXTAUTH_URL}/${locale || 'en'}/dashboard`, redirect: true });
}
