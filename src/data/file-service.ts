import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Function overloads for create
async function create(data: Prisma.FileCreateInput): Promise<Prisma.FileGetPayload<object>>;
async function create<I extends Prisma.FileInclude>(
    data: Prisma.FileCreateInput,
    include: I
): Promise<Prisma.FileGetPayload<{ include: I }>>;
async function create(
    data: Prisma.FileCreateInput,
    include?: Prisma.FileInclude
): Promise<Prisma.FileGetPayload<{ include?: Prisma.FileInclude }>> {
    const file = await prisma.file.create({
        data,
        include,
    });

    return file;
}

async function upload() {}

// Define types for better overload handling
type GetOptions<
    S extends Prisma.FileSelect | undefined = undefined,
    I extends Prisma.FileInclude | undefined = undefined,
> = {
    method?: "unique";
    where: Prisma.FileWhereUniqueInput;
} & (S extends Prisma.FileSelect ? { select: S } : object) &
    (I extends Prisma.FileInclude ? { include: I } : object);

type GetFirstOptions<
    S extends Prisma.FileSelect | undefined = undefined,
    I extends Prisma.FileInclude | undefined = undefined,
> = {
    where: Prisma.FileWhereInput;
    method?: "first";
    orderBy?: Prisma.Enumerable<Prisma.FileOrderByWithRelationInput>;
} & (S extends Prisma.FileSelect ? { select: S } : object) &
    (I extends Prisma.FileInclude ? { include: I } : object);

type GetResult<
    S extends Prisma.FileSelect | undefined,
    I extends Prisma.FileInclude | undefined,
> = S extends Prisma.FileSelect
    ? Prisma.FileGetPayload<{ select: S }>
    : I extends Prisma.FileInclude
      ? Prisma.FileGetPayload<{ include: I }>
      : Prisma.FileGetPayload<object>;

// Overloaded function using generic constraints
function get<S extends Prisma.FileSelect | undefined = undefined, I extends Prisma.FileInclude | undefined = undefined>(
    options: GetOptions<S, I> | GetFirstOptions<S, I>
): Promise<GetResult<S, I> | null> {
    if (options.method === "first") {
        return prisma.file.findFirst({
            where: options.where,
            select: "select" in options ? options.select : undefined,
            include: "include" in options ? options.include : undefined,
        }) as Promise<GetResult<S, I> | null>;
    }

    return prisma.file.findUnique({
        where: options.where as Prisma.FileWhereUniqueInput,
        select: "select" in options ? options.select : undefined,
        include: "include" in options ? options.include : undefined,
    }) as Promise<GetResult<S, I> | null>;
}

// Define types for getMultiple
type GetMultipleOptions<
    S extends Prisma.FileSelect | undefined = undefined,
    I extends Prisma.FileInclude | undefined = undefined,
> = {
    where?: Prisma.FileWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.FileOrderByWithRelationInput>;
    take?: number;
} & (S extends Prisma.FileSelect ? { select: S } : object) &
    (I extends Prisma.FileInclude ? { include: I } : object);

type GetMultipleResult<
    S extends Prisma.FileSelect | undefined,
    I extends Prisma.FileInclude | undefined,
> = S extends Prisma.FileSelect
    ? Prisma.FileGetPayload<{ select: S }>[]
    : I extends Prisma.FileInclude
      ? Prisma.FileGetPayload<{ include: I }>[]
      : Prisma.FileGetPayload<object>[];

// Overloaded function using generic constraints
function getMultiple<
    S extends Prisma.FileSelect | undefined = undefined,
    I extends Prisma.FileInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
    return prisma.file.findMany({
        where: options.where,
        select: "select" in options ? options.select : undefined,
        include: "include" in options ? options.include : undefined,
        orderBy: options.orderBy,
        take: options.take,
    }) as Promise<GetMultipleResult<S, I>>;
}

// Function overloads for update
async function update(fileId: string, data: Prisma.FileUpdateInput): Promise<Prisma.FileGetPayload<object>>;
async function update<I extends Prisma.FileInclude>(
    fileId: string,
    data: Prisma.FileUpdateInput,
    include: I
): Promise<Prisma.FileGetPayload<{ include: I }>>;
async function update(
    fileId: string,
    data: Prisma.FileUpdateInput,
    include?: Prisma.FileInclude
): Promise<Prisma.FileGetPayload<{ include?: Prisma.FileInclude }>> {
    return await prisma.file.update({
        where: { id: fileId },
        data,
        include,
    });
}

async function del(fileId: string) {
    await prisma.file.delete({
        where: { id: fileId },
    });
}

export const FileService = {
    create,
    upload,
    get,
    getMultiple,
    update,
    delete: del,
};
