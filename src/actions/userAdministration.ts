"use server"

import { getCurrentSession, invalidateAllSessions } from "@/lib/session";
import { UserAdministration } from "@/lib/definitions";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getUsers(): Promise<{
    error?: string | null,
    users: UserAdministration[]
}> {
    const { user } = await getCurrentSession();

    if (!user || !user.role.includes(Role.ADMIN)) {
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

    return { error: null, users: users };
}

export async function getUser(userId: string): Promise<{
    error?: string | null,
    user: UserAdministration
}> {
    const { user } = await getCurrentSession();

    if (!user || !user.role.includes(Role.ADMIN)) {
        return { error: "Unauthorized", user: {} as UserAdministration };
    }

    const userFetch = await prisma.user.findUnique({
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

    if (!userFetch) {
        return { error: "User not found", user: {} as UserAdministration };
    }

    return { error: null, user: userFetch };
}

export async function deleteUser(userId: string) {
    const { user } = await getCurrentSession();

    if (!user || !user.role.includes(Role.ADMIN)) {
        return { error: "unauthorized" };
    }

    await prisma.user.delete({
        where: { id: userId },
    })

    invalidateAllSessions(userId);

    revalidatePath("/app/administration")
    return { error: null };
}