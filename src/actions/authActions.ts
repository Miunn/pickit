"use server";

import { prisma } from "@/lib/prisma";
import { CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import * as bcrypt from "bcryptjs";
import { createSession, deleteSessionTokenCookie, generateSessionToken, getCurrentSession, invalidateAllSessions, setSessionTokenCookie } from "@/lib/authUtils";
import { getLocale } from "next-intl/server";

export async function SignIn(email: string, password: string): Promise<{
    error: string
} | null> {
    try {
        if (!email || !password) {
            return null;
        }

        const user = await prisma.user.findUnique({
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
                role: true,
            },
            where: {
                email: email as string
            }
        });

        if (!user) {
            return null;
        }

        const match = bcrypt.compareSync(password as string, user.password as string);

        if (!match) {
            return null;
        }

        const token = generateSessionToken();
        const session = await createSession(token, user.id);
        setSessionTokenCookie(token, session.expiresAt);
        return null;
    } catch (e) {
        if (e instanceof CredentialsSignin) {
            return { error: "invalid-credentials" };
        }

        return { error: "unknown-error" };
    }
}

export async function SignOut() {
    const locale = await getLocale();
    const { session } = await getCurrentSession();
    if (!session) {
        return redirect(`/${locale}/signin`);
    }

    await invalidateAllSessions(session.userId);
    deleteSessionTokenCookie();
    return redirect(`/${locale}/signin`);
}
