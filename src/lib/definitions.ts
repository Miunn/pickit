import { FolderTokenPermission, Prisma } from '@prisma/client';
import { z } from 'zod'

export type SessionPayload = {
    id: string;
    roles: string[];
    expiresAt: Date;
}

export type ActionResult = {
    status: string;
    message?: string;
}

export const SignupFormSchema = z.object({
    name: z.string().min(3, { message: 'Be at least 3 characters long' }).trim(),
    email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
    password: z
        .string()
        .min(8, { message: 'Be at least 8 characters long' })
        .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
        .regex(/[0-9]/, { message: 'Contain at least one number.' })
        .regex(/[^a-zA-Z0-9]/, { message: 'Contain at least one special character.' })
        .trim(),
    passwordConfirmation: z.string(),
}).superRefine(({ password, passwordConfirmation }, ctx) => {
    if (password !== passwordConfirmation) {
        ctx.addIssue({
            code: "custom",
            message: "The passwords did not match",
            path: ['passwordConfirmation']
        });
    }
});

export const SignInFormSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
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
                return Array.from(file).every((f: any) => f.type.startsWith('image/'));
            }, {
                message: 'File must be an image',
            })
            .refine((file) => Array.from(file).every((f: any) => file.size < 5000000), {
                message: "Max size is 5MB."
            })
        : z.array(z.instanceof(File))
            .nonempty({ message: 'Please select at least one file' })
            .refine((file) => {
                return Array.from(file).every((f) => f.type.startsWith('image/'));
            }, {
                message: 'File must be an image',
            })
});

export const CreateAccessTokenFormSchema = z.object({
    folder: z.string().max(255, {
        message: "Choosen folder is invalid"
    }),
    permission: z.nativeEnum(FolderTokenPermission),
    expiresAt: z.date({
        required_error: "Please select an expiry date",
        invalid_type_error: "Selected date is invalid",
    }).min(new Date(), {
        message: "Expiry date should be in the future"
    })
})

export const CreatePersonAccessTokenFormSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
    permission: z.nativeEnum(FolderTokenPermission),
    expiresAt: z.date({
        required_error: "Please select an expiry date",
        invalid_type_error: "Selected date is invalid",
    }).min(new Date(), {
        message: "Expiry date should be in the future"
    })
})

export const AccountFormSchema = z.object({
    profilePicture: z.any()
        .refine((file) => file.size < 5000000, { message: "Max size is 5MB." })
        .refine((file) => file.type.startsWith('image/'), { message: "File must be an image" })
        .optional(),
    name: z.string().min(3, { message: 'Be at least 3 characters long' }).trim().optional().or(z.literal('')),
    email: z.string().email({ message: 'Please enter a valid email.' }).trim().optional().or(z.literal('')),
})

export const ChangePasswordSchema = z.object({
    oldPassword: z.string(),
    newPassword: z
        .string()
        .min(8, { message: 'Must be at least 8 characters long' })
        .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
        .regex(/[0-9]/, { message: 'Contain at least one number.' })
        .regex(/[^a-zA-Z0-9]/, { message: 'Contain at least one special character.' })
        .trim(),
    passwordConfirmation: z.string(),
}).superRefine(({ newPassword, passwordConfirmation }, ctx) => {
    if (newPassword !== passwordConfirmation) {
        ctx.addIssue({
            code: "custom",
            message: "The passwords did not match",
            path: ['passwordConfirmation']
        });
    }
})

export const RequestPasswordResetFormSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
})

export const ResetPasswordFormSchema = z.object({
    password: z
        .string()
        .min(8, { message: 'Must be at least 8 characters long' })
        .regex(/[a-zA-Z]/, { message: 'Must contain at least one letter.' })
        .regex(/[0-9]/, { message: 'Must contain at least one number.' })
        .regex(/[^a-zA-Z0-9]/, { message: 'Must contain at least one special character.' })
        .trim(),
    passwordConfirmation: z.string(),
}).superRefine(({ password, passwordConfirmation }, ctx) => {
    if (password !== passwordConfirmation) {
        ctx.addIssue({
            code: "custom",
            message: "The passwords did not match",
            path: ['passwordConfirmation']
        });
    }
})

export type SignInFormState =
    | {
        errors?: {
            email?: string[]
            password?: string[]
        }
        message?: string
    }
    | undefined


const userLight = Prisma.validator<Prisma.UserDefaultArgs>()({
    select: { id: true, name: true, email: true, emailVerified: true, emailVerificationDeadline: true, image: true, usedStorage: true, createdAt: true, updatedAt: true }
})

export type UserLight = Prisma.UserGetPayload<typeof userLight>

const lightFolders = Prisma.validator<Prisma.FolderDefaultArgs>()({
    select: { id: true, name: true }
})

export type LightFolder = Prisma.FolderGetPayload<typeof lightFolders>

const folderWithImages = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { images: true }
})

export type FolderWithImages = Prisma.FolderGetPayload<typeof folderWithImages>

const folderWithImagesWithFolder = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { images: { include: { folder: true } } },
})

export type FolderWithImagesWithFolder = Prisma.FolderGetPayload<typeof folderWithImagesWithFolder>

const folderWithAccessToken = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { AccessToken: true }
})

export type FolderWithAccessToken = Prisma.FolderGetPayload<typeof folderWithAccessToken>

const folderWithImagesCount = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { _count: { select: { images: true } } }
})

export type FolderWithImagesCount = Prisma.FolderGetPayload<typeof folderWithImagesCount>

const folderWithCover = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { cover: true }
})

export type FolderWithCover = Prisma.FolderGetPayload<typeof folderWithCover>

const imageLight = Prisma.validator<Prisma.ImageDefaultArgs>()({
    select: { id: true, name: true, folder: { select: { id: true, name: true } } }
})

export type ImageLightWithFolderName = Prisma.ImageGetPayload<typeof imageLight>

const imageWithFolder = Prisma.validator<Prisma.ImageDefaultArgs>()({
    include: { folder: true },
})

export type ImageWithFolder = Prisma.ImageGetPayload<typeof imageWithFolder>

const accessTokenWithFolder = Prisma.validator<Prisma.AccessTokenDefaultArgs>()({
    include: { folder: true },
})

export type AccessTokenWithFolder = Prisma.AccessTokenGetPayload<typeof accessTokenWithFolder>

const personAccessTokenWithFolder = Prisma.validator<Prisma.PersonAccessTokenDefaultArgs>()({
    include: { folder: true },
})

export type PersonAccessTokenWithFolder = Prisma.PersonAccessTokenGetPayload<typeof personAccessTokenWithFolder>