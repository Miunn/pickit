import NextAuth from "next-auth";
import {prisma} from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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
            async authorize(credentials) {

                if (!credentials.email || !credentials.password) {
                    console.log("Missing credentials");
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });

                if (!user) {
                    console.log("User not found");
                    return null;
                }

                const match = await bcrypt.compare(credentials.password, user.password);

                if (!match) {
                    console.log("Password doesn't match");
                    return null;
                }

                return { id: user.id, email: user.email, name: user.name };
            },
        })
    ],
    pages: {
        signIn: '/signin',
    },
    callbacks: {
        authorized: async ({ auth }) => {
            return !!auth;
        },
        jwt: ({token, user}) => {
            if (user) {
                return {
                    ...token,
                    id: user.id,
                };
            }
            return token;
        },
        session: ({session, token}) => {
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
