"use server"

import { RequestPasswordResetFormSchema, UserLight } from "@/lib/definitions";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as bcrypt from "bcryptjs";
import { transporter } from "@/lib/mailing";
import { VerifyEmailRequest } from "@prisma/client";
import { addDays } from "date-fns";
import { getCurrentSession } from "@/lib/session";
import { render } from "@react-email/components";
import VerifyEmail from "@/components/emails/VerifyEmail";
import ResetPasswordTemplate from "@/components/emails/ResetPasswordTemplate";
import { z } from "zod";

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

export async function sendVerificationEmail(email: string): Promise<{
    error: string | null,
    user: {
        id: string,
        name: string,
        email: string,
        emailVerified: boolean
    } | null
}> {
    const { user } = await getCurrentSession(); // THIS METHOD USES CACHE SO IF THE USER VERIFIED IT MAY NOT HAVE BEEN UPDATED YET

    if (!user) {
        return { error: "You must be logged in to fetch user info", user: null };
    }

    const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true
        }
    });

    if (!currentUser) {
        return { error: "user-not-found", user: null };
    }

    if (currentUser.emailVerified) {
        return { error: "already-verified", user: currentUser };
    }

    const token = crypto.randomUUID();
    try {
        await prisma.verifyEmailRequest.deleteMany({
            where: { userId: currentUser.id }
        });
    } catch (e) {
        console.error("Error deleting previous verification requests", e);
    }

    await prisma.verifyEmailRequest.create({
        data: {
            token: token,
            expires: addDays(new Date(), 7),
            user: {
                connect: {
                    id: currentUser.id
                }
            }
        }
    });

    const emailHtml = await render(<VerifyEmail name={currentUser.name} token={token} />);


    const mail = await transporter.sendMail({
        from: `"The Pickit Team" <${process.env.MAIL_SENDER}>`,
        to: email,
        subject: "Verify your email",
        html: emailHtml,
    })

    return { error: null, user: currentUser };
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


    if (!bcrypt.compareSync(oldPassword, userPassword.password || "")) {
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

export async function requestPasswordReset(data: z.infer<typeof RequestPasswordResetFormSchema>): Promise<{
    error: string | null,
}> {

    const parsedData = RequestPasswordResetFormSchema.safeParse(data);

    if (!parsedData.success) {
        return { error: "invalid-data" };
    }

    const user = await prisma.user.findUnique({
        where: { email: parsedData.data.email }
    });

    if (!user || !user.password) {
        return { error: null }; // Don't leak if the email is registered or not
    }

    try {
        await prisma.passwordResetRequest.deleteMany({
            where: { userId: user.id }
        });
    } catch (e) {
        console.error("Error deleting previous password reset requests", e);
    }

    const token = crypto.randomUUID();
    await prisma.passwordResetRequest.create({
      data: {
        token: token,
        expires: addDays(new Date(), 7),
        user: { connect: { id: user.id } }
      }
    });
  
    const emailHtml = await render(<ResetPasswordTemplate name={user.name} token={token} />);
  
    const mail = await transporter.sendMail({
      from: `"The Pickit Team" <${process.env.MAIL_SENDER}>`,
      to: user.email,
      subject: "Reset your password",
      text: "Reset your password",
      html: emailHtml,
    })

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