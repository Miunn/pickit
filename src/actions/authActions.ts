"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import * as bcrypt from "bcryptjs";
import { createSession, deleteSessionTokenCookie, generateSessionToken, getCurrentSession, invalidateAllSessions, setSessionTokenCookie } from "@/lib/session";
import { getLocale } from "next-intl/server";

export async function SignIn(email: string, password: string): Promise<{
    error: string
} | null> {
    try {
        if (!email || !password) {
            return { error: "invalid-credentials" };
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
            return { error: "invalid-credentials" };
        }

        const match = bcrypt.compareSync(password as string, user.password as string);

        if (!match) {
            return { error: "invalid-credentials" };
        }

        const token = generateSessionToken();
        const session = await createSession(token, user.id);
        setSessionTokenCookie(token, session.expiresAt);
        return null;
    } catch (e) {
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
