'use server'

import { hasFolderOwnerAccess } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { FolderTag } from "@prisma/client";

export async function createTag(name: string, folderId: string, fileId?: string): Promise<{ success: true, tag: FolderTag } | { success: false, error: string }> {
    if (name.length === 0) {
        return {
            success: false,
            error: "name is required"
        }
    }

    if (!(await hasFolderOwnerAccess(folderId))) {
        return {
            success: false,
            error: "unauthorized"
        }
    }

    const tag = await prisma.folderTag.create({
        data: { name, folderId, files: fileId ? { connect: { id: fileId } } : undefined },
    })

    return {
        success: true,
        tag
    }
}