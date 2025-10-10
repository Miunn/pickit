import { prisma } from "@/lib/prisma";
import { FileLike, Prisma } from "@prisma/client";

// Function overloads for create
async function create(data: Prisma.FileLikeCreateInput): Promise<Prisma.FileLikeGetPayload<object>>;
async function create<I extends Prisma.FileLikeInclude>(
    data: Prisma.FileLikeCreateInput,
    include: I
): Promise<Prisma.FileLikeGetPayload<{ include: I }>>;
async function create(
    data: Prisma.FileLikeCreateInput,
    include?: Prisma.FileLikeInclude
): Promise<Prisma.FileLikeGetPayload<{ include?: Prisma.FileLikeInclude }>> {
    const file = await prisma.fileLike.create({
        data,
        include,
    });

    return file;
}

// Define types for better overload handling
type GetOptions<
    S extends Prisma.FileLikeSelect | undefined = undefined,
    I extends Prisma.FileLikeInclude | undefined = undefined,
> = {
    method?: "unique";
    where: Prisma.FileLikeWhereUniqueInput;
} & (S extends Prisma.FileLikeSelect ? { select: S } : object) &
    (I extends Prisma.FileLikeInclude ? { include: I } : object);

type GetFirstOptions<
    S extends Prisma.FileLikeSelect | undefined = undefined,
    I extends Prisma.FileLikeInclude | undefined = undefined,
> = {
    where: Prisma.FileLikeWhereInput;
    method?: "first";
    orderBy?: Prisma.Enumerable<Prisma.FileLikeOrderByWithRelationInput>;
} & (S extends Prisma.FileLikeSelect ? { select: S } : object) &
    (I extends Prisma.FileLikeInclude ? { include: I } : object);

type GetResult<
    S extends Prisma.FileLikeSelect | undefined,
    I extends Prisma.FileLikeInclude | undefined,
> = S extends Prisma.FileLikeSelect
    ? Prisma.FileLikeGetPayload<{ select: S }>
    : I extends Prisma.FileLikeInclude
      ? Prisma.FileLikeGetPayload<{ include: I }>
      : Prisma.FileLikeGetPayload<object>;

// Overloaded function using generic constraints
function get<
    S extends Prisma.FileLikeSelect | undefined = undefined,
    I extends Prisma.FileLikeInclude | undefined = undefined,
>(options: GetOptions<S, I> | GetFirstOptions<S, I>): Promise<GetResult<S, I> | null> {
    if (options.method === "first") {
        return prisma.fileLike.findFirst({
            where: options.where,
            select: "select" in options ? options.select : undefined,
            include: "include" in options ? options.include : undefined,
        }) as Promise<GetResult<S, I> | null>;
    }

    return prisma.fileLike.findUnique({
        where: options.where as Prisma.FileLikeWhereUniqueInput,
        select: "select" in options ? options.select : undefined,
        include: "include" in options ? options.include : undefined,
    }) as Promise<GetResult<S, I> | null>;
}

// Define types for getMultiple
type GetMultipleOptions<
    S extends Prisma.FileLikeSelect | undefined = undefined,
    I extends Prisma.FileLikeInclude | undefined = undefined,
> = {
    where?: Prisma.FileLikeWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.FileOrderByWithRelationInput>;
    take?: number;
} & (S extends Prisma.FileLikeSelect ? { select: S } : object) &
    (I extends Prisma.FileLikeInclude ? { include: I } : object);

type GetMultipleResult<
    S extends Prisma.FileLikeSelect | undefined,
    I extends Prisma.FileLikeInclude | undefined,
> = S extends Prisma.FileLikeSelect
    ? Prisma.FileLikeGetPayload<{ select: S }>[]
    : I extends Prisma.FileLikeInclude
      ? Prisma.FileLikeGetPayload<{ include: I }>[]
      : Prisma.FileLikeGetPayload<object>[];

// Overloaded function using generic constraints
function getMultiple<
    S extends Prisma.FileLikeSelect | undefined = undefined,
    I extends Prisma.FileLikeInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
    return prisma.fileLike.findMany({
        where: options.where,
        select: "select" in options ? options.select : undefined,
        include: "include" in options ? options.include : undefined,
        orderBy: options.orderBy,
        take: options.take,
    }) as Promise<GetMultipleResult<S, I>>;
}

// Function overloads for update
async function update(fileId: string, data: Prisma.FileLikeUpdateInput): Promise<Prisma.FileLikeGetPayload<object>>;
async function update<I extends Prisma.FileLikeInclude>(
    fileId: string,
    data: Prisma.FileLikeUpdateInput,
    include: I
): Promise<Prisma.FileLikeGetPayload<{ include: I }>>;
async function update(
    fileId: string,
    data: Prisma.FileLikeUpdateInput,
    include?: Prisma.FileLikeInclude
): Promise<Prisma.FileLikeGetPayload<{ include?: Prisma.FileLikeInclude }>> {
    const file = await prisma.fileLike.update({
        where: { id: fileId },
        data,
        include,
    });

    return file;
}

async function del(fileId: string): Promise<FileLike> {
    return await prisma.fileLike.delete({
        where: { id: fileId },
    });
}

export const FileLikeService = {
    create,
    get,
    getMultiple,
    update,
    delete: del,
};
