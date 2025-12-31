"use server";

import { redirect } from "next/navigation";
import * as bcrypt from "bcryptjs";
import {
    createSession,
    deleteSessionTokenCookie,
    generateSessionToken,
    getCurrentSession,
    invalidateAllSessions,
    setSessionTokenCookie,
} from "@/lib/session";
import { getLocale } from "next-intl/server";
import { UserService } from "@/data/user-service";

export async function SignIn(
    email: string,
    password: string
): Promise<{
    error: string;
} | null> {
    try {
        if (!email || !password) {
            return { error: "invalid-credentials" };
        }

        const user = await UserService.get({
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
                role: true,
            },
            where: {
                email: email,
            },
        });

        if (!user?.password) {
            return { error: "invalid-credentials" };
        }

        const match = bcrypt.compareSync(password, user.password);

        if (!match) {
            return { error: "invalid-credentials" };
        }

        const token = generateSessionToken();
        const session = await createSession(token, user.id);
        await setSessionTokenCookie(token, session.expiresAt);
        return null;
    } catch {
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
    await deleteSessionTokenCookie();
    return redirect(`/${locale}/signin`);
}
