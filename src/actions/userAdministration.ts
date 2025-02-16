"use server"

import { UserAdministration } from "@/lib/definitions";
import { auth } from "./auth";
import { prisma } from "@/lib/prisma";

export async function getUsers(): Promise<{
    error?: string | null,
    users: UserAdministration[]
}> {

    const session = await auth();

    if (!session?.user || !session.user.role.includes("ADMIN")) {
        return { error: "Unauthorized", users: [] };
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            emailVerificationDeadline: true,
            image: true,
            role: true,
            usedStorage: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    folders: true,
                    images: true
                }
            }
        }
    })
    console.log("Users: ", users);

    return { error: null, users: users };
}

export async function getUser(userId: string): Promise<{
    error?: string | null,
    user: UserAdministration
}> {
    const session = await auth();

    if (!session?.user || !session.user.role.includes("ADMIN")) {
        return { error: "Unauthorized", user: {} as UserAdministration };
    }

    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            emailVerificationDeadline: true,
            image: true,
            role: true,
            usedStorage: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    folders: true,
                    images: true
                }
            }
        }
    })

    if (!user) {
        return { error: "User not found", user: {} as UserAdministration };
    }

    return { error: null, user: user };
}