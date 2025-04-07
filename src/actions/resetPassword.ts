import { prisma } from "@/lib/prisma";
import { PasswordResetRequestStatus } from "@prisma/client";

export async function getResetPasswordRequest(token: string): Promise<{ error: string | null, status: PasswordResetRequestStatus }> {
    
    const request = await prisma.passwordResetRequest.findUnique({
        where: {
            token
        }
    });

    if (!request) {
        return { error: "token-not-found", status: PasswordResetRequestStatus.ERROR };
    }

    return { error: null, status: request.status };
}