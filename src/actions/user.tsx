"use server";

import { RequestPasswordResetFormSchema } from "@/lib/definitions";
import { revalidatePath } from "next/cache";
import * as bcrypt from "bcryptjs";
import { transporter } from "@/lib/mailing";
import { PasswordResetRequestStatus } from "@prisma/client";
import { addDays } from "date-fns";
import { getCurrentSession } from "@/lib/session";
import { render } from "@react-email/components";
import VerifyEmail from "@/components/emails/VerifyEmail";
import ResetPasswordTemplate from "@/components/emails/ResetPasswordTemplate";
import { z } from "zod";
import { UserService } from "@/data/user-service";
import { PasswordResetRequestService } from "@/data/password-reset-service";
import { VerifyEmailRequestService } from "@/data/verify-email-service";

export async function updateUser(id: string, name?: string, email?: string) {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to fetch user info", user: null };
    }

    if (user.id !== id) {
        return { error: "You can't update another user's info", user: null };
    }

    await UserService.update(id, {
        name,
        email,
        emailVerified: email && email !== user?.email ? false : user.emailVerified,
        emailVerificationDeadline:
            email && email !== user?.email ? addDays(new Date(), 7) : user.emailVerificationDeadline,
    });

    if (email && email !== user?.email) {
        await sendVerificationEmail(email);
    }

    revalidatePath("/app/account");
    return true;
}

export async function setupE2EE(
    privateKey: string,
    publicKey: string,
    iv: string,
    salt: string
): Promise<{ error: string | null }> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to setup E2EE" };
    }

    await UserService.update(user.id, {
        privateKey,
        publicKey,
        e2eeSalt: salt,
        e2eeSaltIv: iv,
    });

    return { error: null };
}

export async function sendVerificationEmail(email: string): Promise<{
    error: string | null;
    user: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
    } | null;
}> {
    const { user } = await getCurrentSession(); // THIS METHOD USES CACHE SO IF THE USER VERIFIED IT MAY NOT HAVE BEEN UPDATED YET

    if (!user) {
        return { error: "You must be logged in to fetch user info", user: null };
    }

    const currentUser = await UserService.get({
        where: { id: user.id },
        select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
        },
    });

    if (!currentUser) {
        return { error: "user-not-found", user: null };
    }

    if (currentUser.emailVerified) {
        return { error: "already-verified", user: currentUser };
    }

    const token = crypto.randomUUID();
    try {
        await VerifyEmailRequestService.deleteMany({
            where: { userId: currentUser.id },
        });
    } catch (e) {
        console.error("Error deleting previous verification requests", e);
    }

    await VerifyEmailRequestService.create({
        token: token,
        expires: addDays(new Date(), 7),
        user: {
            connect: {
                id: currentUser.id,
            },
        },
    });

    const emailHtml = await render(<VerifyEmail name={currentUser.name} token={token} />);

    await transporter.sendMail({
        from: `"The Echomori Team" <${process.env.MAIL_SENDER}>`,
        to: email,
        subject: "Verify your email",
        html: emailHtml,
    });

    return { error: null, user: currentUser };
}

export async function changePassword(
    id: string,
    oldPassword: string,
    newPassword: string
): Promise<{
    error: string | null;
}> {
    const { user } = await getCurrentSession();

    if (!user) {
        return { error: "You must be logged in to fetch user info" };
    }

    if (user.id !== id) {
        return { error: "You can't update another user's info" };
    }

    const userPassword = await UserService.get({
        where: {
            id,
        },
        select: {
            id: true,
            password: true,
        },
    });

    if (!userPassword) {
        return { error: "user-not-found" };
    }

    if (!bcrypt.compareSync(oldPassword, userPassword.password || "")) {
        return { error: "invalid-old" };
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedNewPassword = bcrypt.hashSync(newPassword, salt);
    await UserService.update(id, {
        password: hashedNewPassword,
    });

    revalidatePath("/app/account");
    return { error: null };
}

export async function verifyAccount(token: string): Promise<{
    error: string | null;
    user: { name: string } | null;
}> {
    const tokenData = await VerifyEmailRequestService.get({
        where: {
            token: token,
        },
        include: {
            user: {
                select: { id: true },
            },
        },
    });

    if (!tokenData) {
        return { error: "invalid-token", user: null };
    }

    const user = await UserService.update(tokenData.user.id, {
        emailVerified: true,
        emailVerificationDeadline: null,
    });

    await VerifyEmailRequestService.delete(token);

    return { error: null, user };
}

export async function requestPasswordReset(data: z.infer<typeof RequestPasswordResetFormSchema>): Promise<{
    error: string | null;
}> {
    const parsedData = RequestPasswordResetFormSchema.safeParse(data);

    if (!parsedData.success) {
        return { error: "invalid-data" };
    }

    const user = await UserService.get({
        where: { email: parsedData.data.email },
        select: { id: true, email: true, name: true, password: true },
    });

    if (!user?.password) {
        return { error: null }; // Don't leak if the email is registered or not
    }

    try {
        await PasswordResetRequestService.deleteMany({
            where: { userId: user.id },
        });
    } catch (e) {
        console.error("Error deleting previous password reset requests", e);
    }

    const token = crypto.randomUUID();
    await PasswordResetRequestService.create({
        token: token,
        expires: addDays(new Date(), 7),
        user: { connect: { id: user.id } },
    });

    const emailHtml = await render(<ResetPasswordTemplate name={user.name} token={token} />);

    await transporter.sendMail({
        from: `"The Echomori Team" <${process.env.MAIL_SENDER}>`,
        to: user.email,
        subject: "Reset your password",
        text: "Reset your password",
        html: emailHtml,
    });

    return { error: null };
}

export async function resetPassword(
    token: string,
    newPassword: string
): Promise<{
    error: string | null;
}> {
    const resetRequest = await PasswordResetRequestService.get({
        where: { token },
    });

    if (!resetRequest) {
        return { error: "invalid-token" };
    }

    if (resetRequest.status !== PasswordResetRequestStatus.PENDING) {
        if (resetRequest.status === PasswordResetRequestStatus.SUCCESS) {
            return { error: "already-reset" };
        }

        return { error: "invalid-status" };
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedNewPassword = bcrypt.hashSync(newPassword, salt);

    await UserService.update(resetRequest.userId, {
        password: hashedNewPassword,
    });

    await PasswordResetRequestService.update(token, {
        status: PasswordResetRequestStatus.SUCCESS,
    });

    return { error: null };
}
