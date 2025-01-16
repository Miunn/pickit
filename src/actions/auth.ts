import NextAuth from "next-auth";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs";
import { User } from "@prisma/client";

export const { auth, handlers, signIn, signOut } = NextAuth({
    session: {
        strategy: "jwt",
    },
    providers: [
        Credentials({
            id: "credentials",
            name: "Credentials",
            type: "credentials",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "email@mail.com" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials: Partial<Record<"email" | "password", unknown>>): Promise<null | { id: string, email: string, name: string, role: string[] }> {

                if (!credentials.email || !credentials.password) {
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
                        email: credentials.email as string
                    }
                });

                if (!user) {
                    return null;
                }

                const match = bcrypt.compareSync(credentials.password as string, user.password as string);

                if (!match) {
                    return null;
                }

                return { id: user.id, email: user.email, name: user.name, role: user.role };
            },
        })
    ],
    pages: {
        signIn: '/signin',
    },
    callbacks: {
        authorized: async ({ auth, request: { nextUrl } }) => {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/dashboard', nextUrl));
            }
            return true;
        },
        jwt: ({ token, user }) => {
            if (user) {
                const u = user as unknown as User;
                return {
                    ...token,
                    id: u.id,
                    role: u.role,
                };
            }
            return token;
        },
        session: ({ session, token }: any) => {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id,
                    role: token.role,
                }
            };
        }
    }
})
