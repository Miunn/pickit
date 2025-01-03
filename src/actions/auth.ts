import NextAuth from "next-auth";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs";

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
            async authorize(credentials: Partial<Record<"email" | "password", unknown>>) {

                if (!credentials.email || !credentials.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        password: true,
                    },
                    where: {
                        email: credentials.email as string
                    }
                });

                if (!user) {
                    console.log("User not found");
                    return null;
                }

                console.log(credentials);
                console.log(user);
                const match = bcrypt.compareSync(credentials.password as string, user.password as string);
                console.log("Math:", match);

                if (!match) {
                    console.log("Password doesn't match");
                    return null;
                }

                console.log("Return array");
                return { id: user.id, email: user.email, name: user.name };
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
                return {
                    ...token,
                    id: user.id,
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
                }
            };
        }
    }
})
