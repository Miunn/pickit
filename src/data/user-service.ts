import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function create(data: Prisma.UserCreateInput) {
    return await prisma.user.create({
        data,
    });
}

// Define types for better overload handling
type GetOptions<
    S extends Prisma.UserSelect | undefined = undefined,
    I extends Prisma.UserInclude | undefined = undefined,
> = {
    where: Prisma.UserWhereUniqueInput;
} & (S extends Prisma.UserSelect ? { select: S } : object) &
    (I extends Prisma.UserInclude ? { include: I } : object);

type GetResult<
    S extends Prisma.UserSelect | undefined,
    I extends Prisma.UserInclude | undefined,
> = S extends Prisma.UserSelect
    ? Prisma.UserGetPayload<{ select: S }>
    : I extends Prisma.UserInclude
      ? Prisma.UserGetPayload<{ include: I }>
      : Prisma.UserGetPayload<object>;

// Overloaded function using generic constraints
function get<S extends Prisma.UserSelect | undefined = undefined, I extends Prisma.UserInclude | undefined = undefined>(
    options: GetOptions<S, I>
): Promise<GetResult<S, I> | null> {
    return prisma.user.findUnique({
        where: options.where,
        select: "select" in options ? options.select : undefined,
        include: "include" in options ? options.include : undefined,
    }) as Promise<GetResult<S, I> | null>;
}

// Define types for getMultiple
type GetMultipleOptions<
    S extends Prisma.UserSelect | undefined = undefined,
    I extends Prisma.UserInclude | undefined = undefined,
> = {
    where?: Prisma.UserWhereInput;
} & (S extends Prisma.UserSelect ? { select: S } : object) &
    (I extends Prisma.UserInclude ? { include: I } : object);

type GetMultipleResult<
    S extends Prisma.UserSelect | undefined,
    I extends Prisma.UserInclude | undefined,
> = S extends Prisma.UserSelect
    ? Prisma.UserGetPayload<{ select: S }>[]
    : I extends Prisma.UserInclude
      ? Prisma.UserGetPayload<{ include: I }>[]
      : Prisma.UserGetPayload<object>[];

// Overloaded function using generic constraints
function getMultiple<
    S extends Prisma.UserSelect | undefined = undefined,
    I extends Prisma.UserInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
    return prisma.user.findMany({
        where: options.where,
        select: "select" in options ? options.select : undefined,
        include: "include" in options ? options.include : undefined,
    }) as Promise<GetMultipleResult<S, I>>;
}

async function update(userId: string, data: Prisma.UserUpdateInput) {
    return await prisma.user.update({
        where: { id: userId },
        data,
    });
}

async function del(userId: string) {
    return await prisma.user.delete({
        where: { id: userId },
    });
}

export const UserService = {
    create,
    get,
    getMultiple,
    update,
    delete: del,
};
