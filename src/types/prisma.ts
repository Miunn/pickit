export enum FolderTokenPermission {
    READ = 'READ',
    WRITE = 'WRITE',
    ADMIN = 'ADMIN'
}

export enum Role {
    USER = 'USER',
    ADMIN = 'ADMIN'
}

export enum PasswordResetRequestStatus {
    PENDING = 'PENDING',
    USED = 'USED',
    EXPIRED = 'EXPIRED'
}

export type PersonAccessToken = {
    id: string
    name: string
    isActive: boolean
    isLocked: boolean
    permissions: FolderTokenPermission[]
    // Add other fields as needed
}

export type AccessToken = {
    id: string
    name: string
    isActive: boolean
    isLocked: boolean
    permissions: FolderTokenPermission[]
    // Add other fields as needed
}

export type Image = {
    id: string
    name: string
    size: number
    // Add other fields as needed
}

export type Video = {
    id: string
    name: string
    size: number
    // Add other fields as needed
}

// Add other types as needed 