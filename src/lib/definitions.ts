import {z} from 'zod'

export type SessionPayload = {
    id: string;
    roles: string[];
    expiresAt: Date;
}

export const SignupFormSchema = z.object({
    name: z.string().min(3, {message: 'Be at least 3 characters long'}).trim(),
    email: z.string().email({message: 'Please enter a valid email.'}).trim(),
    password: z
        .string()
        .min(8, {message: 'Be at least 8 characters long'})
        .regex(/[a-zA-Z]/, {message: 'Contain at least one letter.'})
        .regex(/[0-9]/, {message: 'Contain at least one number.'})
        .regex(/[^a-zA-Z0-9]/, {message: 'Contain at least one special character.'})
        .trim(),
    passwordConfirmation: z.string(),
}).superRefine(({password, passwordConfirmation}, ctx) => {
    console.log(password, passwordConfirmation);
    if (password !== passwordConfirmation) {
        ctx.addIssue({
            code: "custom",
            message: "The passwords did not match",
            path: ['passwordConfirmation']
        });
    }
});

export const SignInFormSchema = z.object({
    email: z.string().email({message: 'Please enter a valid email.'}).trim(),
    password: z
        .string()
        .trim(),
});

export const CreateFolderFormSchema = z.object({
    name: z.string().min(2, {
        message: "The folders name must be at least 2 characters",
    }).max(255),
});

export const RenameFolderFormSchema = z.object({
    name: z.string().min(2, {
        message: "The folders name must be at least 2 characters",
    }).max(255),
});

export const UploadImagesFormSchema = z.object({
    images: typeof window === 'undefined'
        ? z.any().refine((file) => {
            return file.length > 0;
        })
            .refine((file) => {
                return Array.from(file).every((f) => f.type.startsWith('image/'));
            }, {
                message: 'File must be an image',
            })
        : z.array(z.instanceof(File))
            .nonempty({message: 'Please select at least one file'})
            .refine((file) => {
                return Array.from(file).every((f) => f.type.startsWith('image/'));
            }, {
                message: 'File must be an image',
            })
});


export type SignInFormState =
    | {
    errors?: {
        email?: string[]
        password?: string[]
    }
    message?: string
}
    | undefined
