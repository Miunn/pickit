"use server";

import {prisma} from "@/lib/prisma";
import {Prisma} from "@prisma/client";
import bcrypt from "bcryptjs";
import {SignupFormSchema} from "@/lib/definitions";

export async function createUserHandler({name, email, password}) {
    let errors = [];

    try {
        SignupFormSchema.safeParse({email, password, passwordConfirmation: password});
    } catch (e) {
        errors.push(e.message);
        return null;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name: name, email: email, password: hashedPassword },
        });
        return 0;
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2002") {
                return null;
            }
            return null;
        }
    }
}
