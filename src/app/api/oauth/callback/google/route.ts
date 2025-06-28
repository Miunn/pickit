import { generateSessionToken, createSession, setSessionTokenCookie } from "@/lib/session";
import { GoogleClaims, googleProvider } from "@/lib/oauth";
import { cookies } from "next/headers";
import { decodeIdToken } from "arctic";
import { redirect } from "next/navigation";
import type { OAuth2Tokens } from "arctic";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieStore = await cookies();
    const storedState = cookieStore.get("google_oauth_state")?.value ?? null;
    const codeVerifier = cookieStore.get("google_code_verifier")?.value ?? null;
    if (code === null || state === null || storedState === null || codeVerifier === null) {
        return redirect("/signin?error=provider-google-invalid-state");
    }

    if (state !== storedState) {
        return new Response(null, {
            status: 400
        });
    }

    let tokens: OAuth2Tokens;
    try {
        tokens = await googleProvider.validateAuthorizationCode(code, codeVerifier);
    } catch (e) {
        // Invalid code or client credentials
        console.log("Error validating code", e);
        return new Response(null, {
            status: 400
        });
    }

    const claims = decodeIdToken(tokens.idToken()) as GoogleClaims;

    const googleUserId = claims.sub;
    const username = claims.name;

    const existingUser = await prisma.user.findUnique({
        where: { googleId: googleUserId }
    });

    if (existingUser !== null) {
        const sessionToken = generateSessionToken();
        const session = await createSession(sessionToken, existingUser.id);
        await setSessionTokenCookie(sessionToken, session.expiresAt);
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/app"
            }
        });
    }

    // Handle existing user with same email
    const existingEmailUser = await prisma.user.findUnique({
        where: { email: claims.email }
    });

    if (existingEmailUser !== null) {
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/signin?error=provider-google-email-exists",
            }
        });
    }

    const user = await prisma.user.create({
        data: {
            googleId: googleUserId,
            name: username,
            email: claims.email,
            emailVerified: claims.email_verified,
            image: claims.picture
        }
    });

    const sessionToken = generateSessionToken();
    const session = await createSession(sessionToken, user.id);
    await setSessionTokenCookie(sessionToken, session.expiresAt);
    return new Response(null, {
        status: 302,
        headers: {
            Location: "/app"
        }
    });
}