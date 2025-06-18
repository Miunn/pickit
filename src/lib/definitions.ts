import { FolderTokenPermission, Prisma, FileType } from '@prisma/client';
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

export const ContactFormSchema = z.object({
    name: z.string().min(3, { message: 'Be at least 3 characters long' }).trim(),
    email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
    message: z.string().min(1, { message: 'Be at least 1 character long' }).trim(),
});

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

export const EditFolderDescriptionFormSchema = z.object({
    description: z.string()
});

export const UploadImagesFormSchema = z.object({
    images: typeof window === 'undefined'
        ? z.any().refine((file) => {
            return file.length > 0;
        })
            .refine((file) => {
                return Array.from(file).every((f: any) => f.type.startsWith('image/') || f.type.startsWith('video/'));
            }, {
                message: 'File must be an image or a video',
            })
            .refine((file) => Array.from(file).every((f: any) => file.size < 1024*1024*1000), {
                message: "Max size is 1GB."
            })
        : z.array(z.instanceof(File))
            .nonempty({ message: 'Please select at least one file' })
            .refine((file) => {
                return Array.from(file).every((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
            }, {
                message: 'File must be an image or a video',
            }),
    shouldNotify: z.boolean().optional()
});

export const RenameImageFormSchema = z.object({
    name: z.string().min(2, {
        message: "The image name must be at least 2 characters",
    }).max(255),
});

export const EditDescriptionFormSchema = z.object({
    description: z.string().min(1, {
        message: "Description must be at least 1 character long"
    }).max(255, {
        message: "Description must be at most 255 characters long"
    })
});

export const CreateCommentFormSchema = z.object({
    content: z.string().min(1, {
        message: "Comment must be at least 1 character long"
    }).max(255, {
        message: "Comment must be at most 255 characters long"
    })
});

export const EditCommentFormSchema = z.object({
    content: z.string().min(1, {
        message: "Comment must be at least 1 character long"
    }).max(255, {
        message: "Comment must be at most 255 characters long"
    })
});

export const LockFolderFormSchema = z.object({
    pin: z.string().min(8, {
        message: "PIN must be 6 characters long"
    }).max(8, {
        message: "PIN must be 6 characters long"
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
    }),
    allowMap: z.boolean().optional()
})

export const CreatePersonAccessTokenFormSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
    permission: z.nativeEnum(FolderTokenPermission),
    pinCode: z.string().length(8).optional(),
    message: z.string().optional(),
    expiresAt: z.date({
        required_error: "Please select an expiry date",
        invalid_type_error: "Selected date is invalid",
    }).min(new Date(), {
        message: "Expiry date should be in the future"
    }),
    allowMap: z.boolean().optional()
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

const userAdministration = Prisma.validator<Prisma.UserDefaultArgs>()({
    select: { id: true, name: true, email: true, emailVerified: true, emailVerificationDeadline: true, role: true, image: true, usedStorage: true, maxStorage: true, createdAt: true, updatedAt: true, _count: { select: { folders: true, files: true } } }
});

export type UserAdministration = Prisma.UserGetPayload<typeof userAdministration>

const userLight = Prisma.validator<Prisma.UserDefaultArgs>()({
    select: { id: true, name: true, email: true, emailVerified: true, emailVerificationDeadline: true, role: true, image: true, usedStorage: true, maxStorage: true, createdAt: true, updatedAt: true }
})

export type UserLight = Prisma.UserGetPayload<typeof userLight>

const userWithNotifications = Prisma.validator<Prisma.UserDefaultArgs>()({
    include: { notifications: true }
})

export type UserWithNotifications = Prisma.UserGetPayload<typeof userWithNotifications>

const lightFolders = Prisma.validator<Prisma.FolderDefaultArgs>()({
    select: { id: true, name: true }
})

export type LightFolder = Prisma.FolderGetPayload<typeof lightFolders>

const folderWithCreatedBy = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { createdBy: true }
})

export type FolderWithCreatedBy = Prisma.FolderGetPayload<typeof folderWithCreatedBy>

const folderWithFiles = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { files: true }
})

export type FolderWithFiles = Prisma.FolderGetPayload<typeof folderWithFiles>

const folderWithImages = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { files: { where: { type: FileType.IMAGE } } }
})

export type FolderWithImages = Prisma.FolderGetPayload<typeof folderWithImages>

const folderWithTags = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { tags: true }
})

export type FolderWithTags = Prisma.FolderGetPayload<typeof folderWithTags>

const folderWithFilesWithFolder = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { files: { include: { folder: true } } },
})

export type FolderWithFilesWithFolder = Prisma.FolderGetPayload<typeof folderWithFilesWithFolder>

const folderWithFilesWithFolderAndComments = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { files: { include: { folder: true, comments: { include: { createdBy: true } } } } },
})

export type FolderWithFilesWithFolderAndComments = Prisma.FolderGetPayload<typeof folderWithFilesWithFolderAndComments>

const folderWithFilesWithFolderAndCommentsAndCreatedBy = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { files: { include: { folder: true, comments: { include: { createdBy: true } } } } },
})

export type FolderWithFilesWithFolderAndCommentsAndCreatedBy = Prisma.FolderGetPayload<typeof folderWithFilesWithFolderAndCommentsAndCreatedBy>

const folderWithAccessToken = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { AccessToken: true }
})

export type FolderWithAccessToken = Prisma.FolderGetPayload<typeof folderWithAccessToken>

const folderWithPersonAccessToken = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { PersonAccessToken: true }
})

export type FolderWithPersonAccessToken = Prisma.FolderGetPayload<typeof folderWithPersonAccessToken>

const folderWithFilesCount = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { _count: { select: { files: true } } }
})

export type FolderWithFilesCount = Prisma.FolderGetPayload<typeof folderWithFilesCount>

const folderWithCover = Prisma.validator<Prisma.FolderDefaultArgs>()({
    include: { cover: true }
})

export type FolderWithCover = Prisma.FolderGetPayload<typeof folderWithCover>

const fileLight = Prisma.validator<Prisma.FileDefaultArgs>()({
    select: { id: true, name: true, folder: { select: { id: true, name: true } } }
})

export type FileLightWithFolderName = Prisma.FileGetPayload<typeof fileLight>

const fileWithTags = Prisma.validator<Prisma.FileDefaultArgs>()({
    include: { tags: true }
})

export type FileWithTags = Prisma.FileGetPayload<typeof fileWithTags>

const fileWithFolder = Prisma.validator<Prisma.FileDefaultArgs>()({
    include: { folder: true },
})

export type FileWithFolder = Prisma.FileGetPayload<typeof fileWithFolder>

const fileWithComments = Prisma.validator<Prisma.FileDefaultArgs>()({
    include: { comments: { include: { createdBy: true } } },
})

export type FileWithComments = Prisma.FileGetPayload<typeof fileWithComments>

const fileWithFolderWithCreatedBy = Prisma.validator<Prisma.FileDefaultArgs>()({
    include: { folder: { include: { createdBy: true } } },
})

export type FileWithFolderWithCreatedBy = Prisma.FileGetPayload<typeof fileWithFolderWithCreatedBy>

const fileWithCommentsWithCreatedBy = Prisma.validator<Prisma.FileDefaultArgs>()({
    include: { comments: { include: { createdBy: true } } },
})

export type FileWithCommentsWithCreatedBy = Prisma.FileGetPayload<typeof fileWithCommentsWithCreatedBy>

const fileWithLikes = Prisma.validator<Prisma.FileDefaultArgs>()({
    include: { likes: true }
})

export type FileWithLikes = Prisma.FileGetPayload<typeof fileWithLikes>

const commentWithCreatedBy = Prisma.validator<Prisma.CommentDefaultArgs>()({
    include: { createdBy: true }
})

export type CommentWithCreatedBy = Prisma.CommentGetPayload<typeof commentWithCreatedBy>

const commentWithLikes = Prisma.validator<Prisma.CommentDefaultArgs>()({
    include: { likes: true }
})

export type CommentWithLikes = Prisma.CommentGetPayload<typeof commentWithLikes>

const accessTokenWithFolder = Prisma.validator<Prisma.AccessTokenDefaultArgs>()({
    include: { folder: true },
})

export type AccessTokenWithFolder = Prisma.AccessTokenGetPayload<typeof accessTokenWithFolder>

const personAccessTokenWithFolder = Prisma.validator<Prisma.PersonAccessTokenDefaultArgs>()({
    include: { folder: true },
})

export type PersonAccessTokenWithFolder = Prisma.PersonAccessTokenGetPayload<typeof personAccessTokenWithFolder>

const personAccessTokenWithFolderWithCreatedBy = Prisma.validator<Prisma.PersonAccessTokenDefaultArgs>()({
    include: { folder: { include: { createdBy: true } } },
})

export type PersonAccessTokenWithFolderWithCreatedBy = Prisma.PersonAccessTokenGetPayload<typeof personAccessTokenWithFolderWithCreatedBy>