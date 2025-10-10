import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Function overloads for create
async function create(data: Prisma.AccessTokenCreateInput): Promise<Prisma.AccessTokenGetPayload<object>>;
async function create<I extends Prisma.AccessTokenInclude>(
    data: Prisma.AccessTokenCreateInput,
    include: I
): Promise<Prisma.AccessTokenGetPayload<{ include: I }>>;
async function create(
    data: Prisma.AccessTokenCreateInput,
    include?: Prisma.AccessTokenInclude
): Promise<Prisma.AccessTokenGetPayload<{ include?: Prisma.AccessTokenInclude }>> {
    return await prisma.accessToken.create({
        data,
        include,
    });
}

// Define types for better overload handling
type GetOptions<
    S extends Prisma.AccessTokenSelect | undefined = undefined,
    I extends Prisma.AccessTokenInclude | undefined = undefined,
> = {
    method?: "unique";
    where: Prisma.AccessTokenWhereUniqueInput;
} & (S extends Prisma.AccessTokenSelect ? { select: S } : object) &
    (I extends Prisma.AccessTokenInclude ? { include: I } : object);

type GetFirstOptions<
    S extends Prisma.AccessTokenSelect | undefined = undefined,
    I extends Prisma.AccessTokenInclude | undefined = undefined,
> = {
    where: Prisma.AccessTokenWhereInput;
    method?: "first";
    orderBy?: Prisma.Enumerable<Prisma.AccessTokenOrderByWithRelationInput>;
} & (S extends Prisma.AccessTokenSelect ? { select: S } : object) &
    (I extends Prisma.AccessTokenInclude ? { include: I } : object);

type GetResult<
    S extends Prisma.AccessTokenSelect | undefined,
    I extends Prisma.AccessTokenInclude | undefined,
> = S extends Prisma.AccessTokenSelect
    ? Prisma.AccessTokenGetPayload<{ select: S }>
    : I extends Prisma.AccessTokenInclude
      ? Prisma.AccessTokenGetPayload<{ include: I }>
      : Prisma.AccessTokenGetPayload<object>;

// Overloaded function using generic constraints
function get<
    S extends Prisma.AccessTokenSelect | undefined = undefined,
    I extends Prisma.AccessTokenInclude | undefined = undefined,
>(options: GetOptions<S, I> | GetFirstOptions<S, I>): Promise<GetResult<S, I> | null> {
    if (options.method === "first") {
        return prisma.accessToken.findFirst({
            where: options.where as Prisma.AccessTokenWhereInput,
            select: "select" in options ? options.select : undefined,
            include: "include" in options ? options.include : undefined,
        }) as Promise<GetResult<S, I> | null>;
    }

    return prisma.accessToken.findUnique({
        where: options.where as Prisma.AccessTokenWhereUniqueInput,
        select: "select" in options ? options.select : undefined,
        include: "include" in options ? options.include : undefined,
    }) as Promise<GetResult<S, I> | null>;
}

// Define types for getMultiple
type GetMultipleOptions<
    S extends Prisma.AccessTokenSelect | undefined = undefined,
    I extends Prisma.AccessTokenInclude | undefined = undefined,
> = {
    where?: Prisma.AccessTokenWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.AccessTokenOrderByWithRelationInput>;
} & (S extends Prisma.AccessTokenSelect ? { select: S } : object) &
    (I extends Prisma.AccessTokenInclude ? { include: I } : object);

type GetMultipleResult<
    S extends Prisma.AccessTokenSelect | undefined,
    I extends Prisma.AccessTokenInclude | undefined,
> = S extends Prisma.AccessTokenSelect
    ? Prisma.AccessTokenGetPayload<{ select: S }>[]
    : I extends Prisma.AccessTokenInclude
      ? Prisma.AccessTokenGetPayload<{ include: I }>[]
      : Prisma.AccessTokenGetPayload<object>[];

// Overloaded function using generic constraints
function getMultiple<
    S extends Prisma.AccessTokenSelect | undefined = undefined,
    I extends Prisma.AccessTokenInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
    return prisma.accessToken.findMany({
        where: options.where,
        select: "select" in options ? options.select : undefined,
        include: "include" in options ? options.include : undefined,
        orderBy: options.orderBy,
    }) as Promise<GetMultipleResult<S, I>>;
}

async function update(token: string, data: Prisma.AccessTokenUpdateInput) {
    return await prisma.accessToken.update({
        where: { token },
        data,
    });
}

async function del(token: string) {
    return await prisma.accessToken.delete({
        where: { token },
    });
}

async function delMany(payload: Prisma.AccessTokenDeleteManyArgs) {
    return await prisma.accessToken.deleteMany(payload);
}

export const AccessTokenService = {
    create,
    get,
    getMultiple,
    update,
    del,
    deleteMany: delMany,
};
