import { prisma } from "@/lib/prisma";

export async function getResetPasswordRequest(token: string): Promise<{ error: string | null }> {
    
    const request = await prisma.passwordResetRequest.findUnique({
        where: {
            token
        }
    });

    if (!request) {
        return { error: "token-not-found" }
    }

    return { error: null };
}