"use server";

import {prisma} from "@/lib/prisma";
import {ActionResult, SignupFormSchema} from "@/lib/definitions";
import * as bcrypt from 'bcryptjs';
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { addDays } from "date-fns";

export async function createUserHandler({name, email, password, passwordConfirmation}: z.infer<typeof SignupFormSchema>): Promise<ActionResult> {
    let errors = [];

    try {
        SignupFormSchema.safeParse({email, password, passwordConfirmation: password});
    } catch (e: any) {
        errors.push(e.message);
        return {
            status: 'error',
            message: e.message
        };
    }

    if (password !== passwordConfirmation) {
        return {
            status: 'error',
            message: "Passwords don't match"
        };
    }

    try {
        const salt = bcrypt.genSaltSync(10)
        const hashedPassword = bcrypt.hashSync(password, salt);
        const verificationToken = crypto.randomUUID();
        const user = await prisma.user.create({
            data: {
                name: name,
                email: email,
                emailVerificationDeadline: addDays(new Date(), 7),
                password: hashedPassword,
                verifiedEmailRequest: {
                    create: {
                        token: verificationToken,
                        expires: addDays(new Date(), 7)
                    }
                }
            },
        });
        
        console.log("Create OK");
        return {
            status: 'ok'
        };
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            return {
                status: "error",
                message: "An account with the same email already exists"
            }
        }

        return {
            status: "error",
            message: "An unknown error happened while creating your account"
        }
    }
}
