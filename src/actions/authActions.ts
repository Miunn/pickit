"use server";

import {signIn, signOut} from "@/actions/auth";

export async function SignIn({email, password, redirect}: { email: string, password: string, redirect: string }) {

    console.log("Base URL:", process.env.NEXTAUTH_URL);
    if (!redirect.startsWith(process.env.NEXTAUTH_URL!)) {
        console.log("Redirect not allowed:", redirect);
        return null;
    }

    return await signIn("credentials", { redirect: true, redirectTo: redirect, email, password });
}

export async function SignOut(locale?: string) {
    return await signOut({ redirectTo: `/${locale || 'en'}/signin?callbackUrl=${process.env.NEXTAUTH_URL}/${locale || 'en'}/dashboard`, redirect: true });
}
