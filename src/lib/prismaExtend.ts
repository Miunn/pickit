import { prisma } from "./prisma"

export async function imageCreateManyAndUpdateSizes(data: { id?: string, name: string, slug: string, extension: string, size: number, width: number, height: number }[], folderId: string, userId: string) {
    await prisma.image.createMany({
        data: data.map(({ id, name, extension, size, width, height }) => ({
            id,
            name,
            extension,
            createdById: userId,
            folderId: folderId,
            size,
            width,
            height
        }))
    })

    await prisma.folder.updateMany({
        where: {
            id: folderId
        },
        data: {
            updatedAt: new Date().toISOString(),
            size: { increment: data.reduce((acc, { size }) => acc + size, 0) }
        }
    })

    await prisma.user.update({
        where: { id: userId },
        data: { usedStorage: { increment: data.reduce((acc, { size }) => acc + size, 0) } }
    })
}

export async function imageDeleteAndUpdateSizes(imageId: string, userId: string) {
    const image = await prisma.image.findUnique({
        where: {
            id: imageId,
            createdBy: {
                id: userId
            }
        },
        include: {
            folder: true,
            createdBy: true
        }
    });

    if (!image) {
        throw new Error("Image not found");
    }

    await prisma.image.delete({
        where: {
            id: imageId
        }
    })

    await prisma.$transaction([
        prisma.folder.update({
            where: { id: image.folderId },
            data: { size: { decrement: image.size } }
        }),
        prisma.user.update({
            where: { id: image.createdById },
            data: { usedStorage: { decrement: image.size } }
        })
    ])
}

export async function folderDeleteAndUpdateSizes(folderId: string, userId: string) {
    const folder = await prisma.folder.findUnique({
        where: {
            id: folderId,
            createdBy: { id: userId }
        },
        include: { createdBy: true }
    });

    if (!folder) {
        throw new Error("Folder not found");
    }

    await prisma.folder.delete({
        where: { id: folderId }
    })
    prisma.user.update({
        where: { id: folder.createdById },
        data: { usedStorage: { decrement: folder.size } }
    })
}