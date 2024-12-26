import { UserLight } from "@/lib/definitions";
import { auth } from "./auth";
import { prisma } from "@/lib/prisma";

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
            createdAt: true,
            updatedAt: true
        }
    });

    if (!user) {
        return { error: "User not found", user: null };
    }

    return { error: null, user };
}