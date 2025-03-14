'use server'

import { ContactFormSchema } from "@/lib/definitions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function createContact(data: z.infer<typeof ContactFormSchema>): Promise<{error?: string}> {
    const parsed = ContactFormSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "invalid-data" };
    }

    try {
        await prisma.contact.create({
            data: {
                name: parsed.data.name,
                email: parsed.data.email,
                message: parsed.data.message
            }
        })
    } catch (error) {
        return { error: "unknown" };
    }

    return {};
}