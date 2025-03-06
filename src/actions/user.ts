"use server"

import { UserLight } from "@/lib/definitions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as bcrypt from "bcryptjs";
import { sendPasswordResetRequest, sendVerificationEmail } from "@/lib/mailing";
import { VerifyEmailRequest } from "@prisma/client";
import { addDays } from "date-fns";
import { getCurrentSession } from "@/lib/authUtils";

export default async function getMe(): Promise<{
    error: string | null,
    user: UserLight | null
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to fetch user info", user: null };
    }

    const userLight = await prisma.user.findUnique({
        where: {
            id: user.id
        },
        select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            emailVerificationDeadline: true,
            role: true,
            image: true,
            usedStorage: true,
            createdAt: true,
            updatedAt: true
        }
    });

    if (!userLight) {
        return { error: "User not found", user: null };
    }

    return { error: null, user: userLight };
}

export async function updateUser(id: string, name?: string, email?: string) {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to fetch user info", user: null };
    }

    if (user.id !== id) {
        return { error: "You can't update another user's info", user: null };
    }

    await prisma.user.update({
        where: {
            id
        },
        data: {
            name,
            email,
            emailVerified: (email && email != user?.email) ? false : user.emailVerified,
            emailVerificationDeadline: (email && email != user?.email) ? addDays(new Date(), 7) : user.emailVerificationDeadline
        }
    });

    if ((email && email != user?.email)) {
        await sendVerificationEmail(email);
    }

    revalidatePath("/app/account");
    return true;
}

export async function changePassword(id: string, oldPassword: string, newPassword: string): Promise<{
    error: string | null,
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to fetch user info" };
    }

    if (user.id !== id) {
        return { error: "You can't update another user's info" };
    }

    const userPassword = await prisma.user.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            password: true
        }
    });

    if (!userPassword) {
        return { error: "user-not-found" };
    }


    if (!bcrypt.compareSync(oldPassword, userPassword.password)) {
        return { error: "invalid-old" };
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedNewPassword = bcrypt.hashSync(newPassword, salt);
    await prisma.user.update({
        where: {
            id
        },
        data: {
            password: hashedNewPassword
        }
    });

    revalidatePath("/app/account");
    return { error: null };
}

export async function getUserVerificationRequest(id: string): Promise<{
    error: string | null,
    token: VerifyEmailRequest | null,
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to fetch user info", token: null };
    }

    if (user.id !== id) {
        return { error: "You can't retreive another user's info", token: null };
    }

    const tokenData = await prisma.verifyEmailRequest.findFirst({
        where: {
            userId: id
        }
    });

    return { error: null, token: tokenData };
}

export async function verifyAccount(token: string): Promise<{
    error: string | null,
    user: { name: string } | null
}> {
    const tokenData = await prisma.verifyEmailRequest.findUnique({
        where: {
            token: token,
        },
        include: {
            user: {
                select: { id: true }
            }
        }
    });

    if (!tokenData) {
        return { error: "invalid-token", user: null };
    }

    const user = await prisma.user.update({
        where: {
            id: tokenData.user.id
        },
        data: {
            emailVerified: true,
            emailVerificationDeadline: null
        },
        select: {
            name: true,
        }
    });

    await prisma.verifyEmailRequest.delete({
        where: {
            token: token
        }
    })

    return { error: null, user };
}

export async function requestPasswordReset(email: string): Promise<{
    error: string | null,
}> {
    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        return { error: null }; // Don't leak if the email is registered or not
    }

    await sendPasswordResetRequest(user.id);

    return { error: null };
}

export async function resetPassword(token: string, newPassword: string): Promise<{
    error: string | null,
}> {
    const resetRequest = await prisma.passwordResetRequest.findUnique({
        where: {
            token
        }
    });

    if (!resetRequest) {
        return { error: "invalid-token" };
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedNewPassword = bcrypt.hashSync(newPassword, salt);

    await prisma.user.update({
        where: {
            id: resetRequest.userId
        },
        data: {
            password: hashedNewPassword
        }
    });

    await prisma.passwordResetRequest.delete({
        where: {
            token
        }
    });

    return { error: null };
}