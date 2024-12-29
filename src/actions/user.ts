"use server"

import { UserLight } from "@/lib/definitions";
import { auth } from "./auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/mailing";

export default async function getMe(): Promise<{
    error: string | null,
    user: UserLight | null
}> {

    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to fetch user info", user: null };
    }

    const user = await prisma.user.findUnique({
        where: {
            id: session.user.id
        },
        select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true,
            usedStorage: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!user) {
        return { error: "User not found", user: null };
    }

    return { error: null, user };
}

export async function updateUser(id: string, name?: string, email?: string) {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to fetch user info", user: null };
    }

    if (session.user.id !== id) {
        return { error: "You can't update another user's info", user: null };
    }

    const user = await prisma.user.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true
        }
    });

    if (!user) {
        return { error: "User not found", user: null };
    }

    await prisma.user.update({
        where: {
            id
        },
        data: {
            name,
            email,
            emailVerified: (email && email != user?.email) ? false : user.emailVerified
        }
    });

    if (!((email && email != user?.email) ? false : user.emailVerified)) {
        sendVerificationEmail(["remcaulier@gmail.com"]);
    }    

    revalidatePath("/dashboard/account");
    return true;
}

export async function changePassword(id: string, oldPassword: string, newPassword: string): Promise<{
    error: string | null,
}> {
    const session = await auth();

    if (!session?.user) {
        return { error: "You must be logged in to fetch user info" };
    }

    if (session.user.id !== id) {
        return { error: "You can't update another user's info" };
    }

    const user = await prisma.user.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            password: true
        }
    });

    if (!user) {
        return { error: "user-not-found" };
    }


    if (!bcrypt.compareSync(oldPassword, user.password)) {
        return { error: "invalid-old" };
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    await prisma.user.update({
        where: {
            id
        },
        data: {
            password: hashedNewPassword
        }
    });

    revalidatePath("/dashboard/account");
    return { error: null };
}