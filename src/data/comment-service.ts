import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Function overloads for create
async function create(data: Prisma.CommentCreateInput): Promise<Prisma.CommentGetPayload<object>>;
async function create<I extends Prisma.CommentInclude>(
    data: Prisma.CommentCreateInput,
    include: I
): Promise<Prisma.CommentGetPayload<{ include: I }>>;
async function create(
    data: Prisma.CommentCreateInput,
    include?: Prisma.CommentInclude
): Promise<Prisma.CommentGetPayload<{ include?: Prisma.CommentInclude }>> {
    const comment = await prisma.comment.create({
        data,
        include,
    });

    return comment;
}

// Define types for better overload handling
type GetOptions<
    S extends Prisma.CommentSelect | undefined = undefined,
    I extends Prisma.CommentInclude | undefined = undefined,
> = {
    where: Prisma.CommentWhereUniqueInput;
} & (S extends Prisma.CommentSelect ? { select: S } : object) &
    (I extends Prisma.CommentInclude ? { include: I } : object);

type GetResult<
    S extends Prisma.CommentSelect | undefined,
    I extends Prisma.CommentInclude | undefined,
> = S extends Prisma.CommentSelect
    ? Prisma.CommentGetPayload<{ select: S }>
    : I extends Prisma.CommentInclude
      ? Prisma.CommentGetPayload<{ include: I }>
      : Prisma.CommentGetPayload<object>;

// Overloaded function using generic constraints
function get<
    S extends Prisma.CommentSelect | undefined = undefined,
    I extends Prisma.CommentInclude | undefined = undefined,
>(options: GetOptions<S, I>): Promise<GetResult<S, I> | null> {
    return prisma.comment.findUnique({
        where: options.where,
        select: "select" in options ? options.select : undefined,
        include: "include" in options ? options.include : undefined,
    }) as Promise<GetResult<S, I> | null>;
}

// Define types for getMultiple
type GetMultipleOptions<
    S extends Prisma.CommentSelect | undefined = undefined,
    I extends Prisma.CommentInclude | undefined = undefined,
> = {
    where?: Prisma.CommentWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.CommentOrderByWithRelationInput>;
    take?: number;
} & (S extends Prisma.CommentSelect ? { select: S } : object) &
    (I extends Prisma.CommentInclude ? { include: I } : object);

type GetMultipleResult<
    S extends Prisma.CommentSelect | undefined,
    I extends Prisma.CommentInclude | undefined,
> = S extends Prisma.CommentSelect
    ? Prisma.CommentGetPayload<{ select: S }>[]
    : I extends Prisma.CommentInclude
      ? Prisma.CommentGetPayload<{ include: I }>[]
      : Prisma.CommentGetPayload<object>[];

// Overloaded function using generic constraints
function getMultiple<
    S extends Prisma.CommentSelect | undefined = undefined,
    I extends Prisma.CommentInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
    return prisma.comment.findMany({
        where: options.where,
        select: "select" in options ? options.select : undefined,
        include: "include" in options ? options.include : undefined,
        orderBy: options.orderBy,
        take: options.take,
    }) as Promise<GetMultipleResult<S, I>>;
}

// Function overloads for update
async function update(commentId: string, data: Prisma.CommentUpdateInput): Promise<Prisma.CommentGetPayload<object>>;
async function update<I extends Prisma.CommentInclude>(
    commentId: string,
    data: Prisma.CommentUpdateInput,
    include: I
): Promise<Prisma.CommentGetPayload<{ include: I }>>;
async function update(
    commentId: string,
    data: Prisma.CommentUpdateInput,
    include?: Prisma.CommentInclude
): Promise<Prisma.CommentGetPayload<{ include?: Prisma.CommentInclude }>> {
    const comment = await prisma.comment.update({
        where: { id: commentId },
        data,
        include,
    });

    return comment;
}

// Function overloads for delete
async function del(options: { commentId: string }): Promise<Prisma.CommentGetPayload<object>>;
async function del<I extends Prisma.CommentInclude>(options: {
    commentId: string;
    include: I;
}): Promise<Prisma.CommentGetPayload<{ include: I }>>;
async function del(options: {
    commentId: string;
    include?: Prisma.CommentInclude;
}): Promise<Prisma.CommentGetPayload<{ include?: Prisma.CommentInclude }>> {
    const comment = await prisma.comment.delete({
        where: { id: options.commentId },
        include: options.include,
    });

    return comment;
}

export const CommentService = {
    create,
    get,
    getMultiple,
    update,
    delete: del,
};
