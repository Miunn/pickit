import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function create(data: Prisma.FolderTagCreateInput) {
    const folder = await prisma.folderTag.create({ data });

    return folder;
}

// Define types for better overload handling
type GetOptions<
    S extends Prisma.FolderTagSelect | undefined = undefined,
    I extends Prisma.FolderTagInclude | undefined = undefined,
> = {
    where: Prisma.FolderTagWhereUniqueInput;
} & (S extends Prisma.FolderTagSelect ? { select: S } : object) &
    (I extends Prisma.FolderTagInclude ? { include: I } : object);

type GetResult<
    S extends Prisma.FolderTagSelect | undefined,
    I extends Prisma.FolderTagInclude | undefined,
> = S extends Prisma.FolderTagSelect
    ? Prisma.FolderTagGetPayload<{ select: S }>
    : I extends Prisma.FolderTagInclude
      ? Prisma.FolderTagGetPayload<{ include: I }>
      : Prisma.FolderTagGetPayload<object>;

// Overloaded function using generic constraints
function get<
    S extends Prisma.FolderTagSelect | undefined = undefined,
    I extends Prisma.FolderTagInclude | undefined = undefined,
>(options: GetOptions<S, I>): Promise<GetResult<S, I> | null> {
    return prisma.folderTag.findUnique({
        where: options.where,
        select: "select" in options ? options.select : undefined,
        include: "include" in options ? options.include : undefined,
    }) as Promise<GetResult<S, I> | null>;
}

// Define types for getMultiple
type GetMultipleOptions<
    S extends Prisma.FolderTagSelect | undefined = undefined,
    I extends Prisma.FolderTagInclude | undefined = undefined,
> = {
    where: Prisma.FolderTagWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.FolderTagOrderByWithRelationInput>;
    take?: number;
} & (S extends Prisma.FolderTagSelect ? { select: S } : object) &
    (I extends Prisma.FolderTagInclude ? { include: I } : object);

type GetMultipleResult<
    S extends Prisma.FolderTagSelect | undefined,
    I extends Prisma.FolderTagInclude | undefined,
> = S extends Prisma.FolderTagSelect
    ? Prisma.FolderTagGetPayload<{ select: S }>[]
    : I extends Prisma.FolderTagInclude
      ? Prisma.FolderTagGetPayload<{ include: I }>[]
      : Prisma.FolderTagGetPayload<object>[];

// Overloaded function using generic constraints
function getMultiple<
    S extends Prisma.FolderTagSelect | undefined = undefined,
    I extends Prisma.FolderTagInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
    return prisma.folderTag.findMany({
        where: options.where,
        select: "select" in options ? options.select : undefined,
        include: "include" in options ? options.include : undefined,
        orderBy: options.orderBy,
        take: options.take,
    }) as Promise<GetMultipleResult<S, I>>;
}

async function update(tagId: string, data: Prisma.FolderTagUpdateInput) {
    const folder = await prisma.folderTag.update({
        where: { id: tagId },
        data,
    });

    return folder;
}

async function del(folderId: string) {
    await prisma.folderTag.delete({
        where: { id: folderId },
    });
}

export const FolderTagService = {
    create,
    get,
    getMultiple,
    update,
    delete: del,
};
