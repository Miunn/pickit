import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function create(data: Prisma.ContactCreateInput) {
    const folder = await prisma.contact.create({
        data: {
            ...data,
        },
    });

    return folder;
}

// Define types for better overload handling
type GetOptions<S extends Prisma.ContactSelect | undefined = undefined> = {
    where: Prisma.ContactWhereUniqueInput;
} & (S extends Prisma.ContactSelect ? { select: S } : object);

type GetResult<S extends Prisma.ContactSelect | undefined> = S extends Prisma.ContactSelect
    ? Prisma.ContactGetPayload<{ select: S }>
    : Prisma.ContactGetPayload<object>;

// Overloaded function using generic constraints
function get<S extends Prisma.ContactSelect | undefined = undefined>(
    options: GetOptions<S>
): Promise<GetResult<S> | null> {
    return prisma.contact.findUnique({
        where: options.where,
        select: "select" in options ? options.select : undefined,
    }) as Promise<GetResult<S> | null>;
}

// Define types for getMultiple
type GetMultipleOptions<S extends Prisma.ContactSelect | undefined = undefined> = {
    where: Prisma.ContactWhereInput;
    orderBy?: Prisma.Enumerable<Prisma.FolderOrderByWithRelationInput>;
    take?: number;
} & (S extends Prisma.ContactSelect ? { select: S } : object);

type GetMultipleResult<S extends Prisma.ContactSelect | undefined> = S extends Prisma.ContactSelect
    ? Prisma.ContactGetPayload<{ select: S }>[]
    : Prisma.ContactGetPayload<object>[];

// Overloaded function using generic constraints
function getMultiple<S extends Prisma.ContactSelect | undefined = undefined>(
    options: GetMultipleOptions<S>
): Promise<GetMultipleResult<S>> {
    return prisma.contact.findMany({
        where: options.where,
        select: "select" in options ? options.select : undefined,
        orderBy: options.orderBy,
        take: options.take,
    }) as Promise<GetMultipleResult<S>>;
}

async function update(id: string, data: Prisma.ContactUpdateInput) {
    const folder = await prisma.contact.update({
        where: { id: id },
        data,
    });

    return folder;
}

async function del(id: string) {
    await prisma.contact.delete({
        where: { id: id },
    });
}

export const ContactService = {
    create,
    get,
    getMultiple,
    update,
    delete: del,
};
