import { Google } from "arctic";

export type GoogleClaims = {
    iss: string;
    azp: string;
    aud: string;
    sub: string;
    email: string;
    email_verified: boolean;
    at_hash: string;
    name: string;
    picture: string;
    given_name: string;
    family_name: string;
    iat: number;
    exp: number;
}

export const googleProvider = new Google(
    process.env.OAUTH_GOOGLE_CLIENT_ID!,
    process.env.OAUTH_GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback/google`
)