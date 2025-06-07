'use server'

import { hasFolderOwnerAccess } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { FolderTag } from "@prisma/client";
import { FileWithTags } from "@/lib/definitions";

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

    const session = await getCurrentSession();
    if (!session?.user) {
        return {
            success: false,
            error: "unauthorized"
        }
    }

    const tag = await prisma.folderTag.create({
        data: { name, folderId, files: fileId ? { connect: { id: fileId } } : undefined, userId: session.user.id },
    })

    return {
        success: true,
        tag
    }
}

export async function addTagsToFile(fileId: string, tagIds: string[]): Promise<{ success: true, tags: FolderTag[], file: FileWithTags } | { success: false, error: string }> {
    if (tagIds.length === 0) {
        return {
            success: false,
            error: "no tags to add"
        }
    }

    const session = await getCurrentSession();
    if (!session?.user) {
        return {
            success: false,
            error: "unauthorized"
        }
    }

    const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: { tags: true }
    });

    if (!file) {
        return {
            success: false,
            error: "file not found"
        }
    }

    if (!(await hasFolderOwnerAccess(file.folderId))) {
        return {
            success: false,
            error: "unauthorized"
        }
    }

    const tags = await prisma.folderTag.findMany({
        where: {
            id: { in: tagIds },
            userId: session.user.id,
            folderId: file.folderId
        }
    });

    if (tags.length !== tagIds.length) {
        return {
            success: false,
            error: "some tags not found"
        }
    }

    const existingTags = file.tags.filter((tag) => tags.some((t) => t.id === tag.id));

    const newTags = tags.filter((tag) => !existingTags.some((t) => t.id === tag.id));

    const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: { tags: { connect: newTags.map((tag) => ({ id: tag.id })) } },
        include: { tags: true }
    });

    return {
        success: true,
        tags: [...existingTags, ...newTags],
        file: updatedFile
    }
}

export async function removeTagsFromFile(fileId: string, tagIds: string[]): Promise<{ success: true, tags: FolderTag[], file: FileWithTags } | { success: false, error: string }> {
    if (tagIds.length === 0) {
        return {
            success: false,
            error: "no tags to remove"
        }
    }

    const session = await getCurrentSession();
    if (!session?.user) {
        return {
            success: false,
            error: "unauthorized"
        }
    }

    const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: { tags: true }
    });

    if (!file) {
        return {
            success: false,
            error: "file not found"
        }
    }

    if (!(await hasFolderOwnerAccess(file.folderId))) {
        return {
            success: false,
            error: "unauthorized"
        }
    }

    const tags = await prisma.folderTag.findMany({
        where: {
            id: { in: tagIds },
            userId: session.user.id,
            folderId: file.folderId
        }
    });

    if (tags.length !== tagIds.length) {
        return {
            success: false,
            error: "some tags not found"
        }
    }

    const existingTags = file.tags.filter((tag) => tags.some((t) => t.id === tag.id));

    const newTags = tags.filter((tag) => !existingTags.some((t) => t.id === tag.id));

    const updatedFile = await prisma.file.update({
        where: { id: fileId },
        data: { tags: { disconnect: tags.map((tag) => ({ id: tag.id })) } },
        include: { tags: true }
    });

    return {
        success: true,
        tags: [...existingTags, ...newTags],
        file: updatedFile
    }
}