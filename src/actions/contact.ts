"use server";

import { ContactService } from "@/data/contact-service";
import { ContactFormSchema } from "@/lib/definitions";
import { z } from "zod";

export async function createContact(data: z.infer<typeof ContactFormSchema>): Promise<{ error?: string }> {
    const parsed = ContactFormSchema.safeParse(data);

    if (!parsed.success) {
        return { error: "invalid-data" };
    }

    try {
        await ContactService.create({
            name: parsed.data.name,
            email: parsed.data.email,
            message: parsed.data.message,
        });
    } catch {
        return { error: "unknown" };
    }

    return {};
}
