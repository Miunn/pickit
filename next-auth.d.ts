import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    export interface Session {
        user: {
            id: string
            role: string[]
        } & DefaultSession;
    }

    export interface User extends DefaultUser {
        id: string;
        role: string[];
    }
}

declare module "next-auth/jwt" {
    export interface JWT extends DefaultJWT {
        id: string;
        role: string[];
    }
}