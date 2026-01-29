import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/data/session";
import { Prisma } from "@prisma/client";

async function create(data: Prisma.VerifyEmailRequestCreateInput) {
	const { user } = await getCurrentSession();

	if (!user) {
		throw new Error("Access denied");
	}

	const folder = await prisma.verifyEmailRequest.create({
		data: {
			...data,
			userId: undefined,
			user: { connect: { id: user.id } },
		},
	});

	return folder;
}

// Define types for better overload handling
type GetOptions<
	S extends Prisma.VerifyEmailRequestSelect | undefined = undefined,
	I extends Prisma.VerifyEmailRequestInclude | undefined = undefined,
> = {
	where: Prisma.VerifyEmailRequestWhereUniqueInput;
} & (S extends Prisma.VerifyEmailRequestSelect ? { select: S } : object) &
	(I extends Prisma.VerifyEmailRequestInclude ? { include: I } : object);

type GetResult<
	S extends Prisma.VerifyEmailRequestSelect | undefined,
	I extends Prisma.VerifyEmailRequestInclude | undefined,
> = S extends Prisma.VerifyEmailRequestSelect
	? Prisma.VerifyEmailRequestGetPayload<{ select: S }>
	: I extends Prisma.VerifyEmailRequestInclude
		? Prisma.VerifyEmailRequestGetPayload<{ include: I }>
		: Prisma.VerifyEmailRequestGetPayload<object>;

// Overloaded function using generic constraints
function get<
	S extends Prisma.VerifyEmailRequestSelect | undefined = undefined,
	I extends Prisma.VerifyEmailRequestInclude | undefined = undefined,
>(options: GetOptions<S, I>): Promise<GetResult<S, I> | null> {
	return prisma.verifyEmailRequest.findUnique({
		where: options.where,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
	}) as Promise<GetResult<S, I> | null>;
}

// Define types for getMultiple
type GetMultipleOptions<
	S extends Prisma.VerifyEmailRequestSelect | undefined = undefined,
	I extends Prisma.VerifyEmailRequestInclude | undefined = undefined,
> = {
	where: Prisma.VerifyEmailRequestWhereInput;
	orderBy?: Prisma.Enumerable<Prisma.FolderOrderByWithRelationInput>;
	take?: number;
} & (S extends Prisma.VerifyEmailRequestSelect ? { select: S } : object) &
	(I extends Prisma.VerifyEmailRequestInclude ? { include: I } : object);

type GetMultipleResult<
	S extends Prisma.VerifyEmailRequestSelect | undefined,
	I extends Prisma.VerifyEmailRequestInclude | undefined,
> = S extends Prisma.VerifyEmailRequestSelect
	? Prisma.VerifyEmailRequestGetPayload<{ select: S }>[]
	: I extends Prisma.VerifyEmailRequestInclude
		? Prisma.VerifyEmailRequestGetPayload<{ include: I }>[]
		: Prisma.VerifyEmailRequestGetPayload<object>[];

// Overloaded function using generic constraints
function getMultiple<
	S extends Prisma.VerifyEmailRequestSelect | undefined = undefined,
	I extends Prisma.VerifyEmailRequestInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
	return prisma.verifyEmailRequest.findMany({
		where: options.where,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
		orderBy: options.orderBy,
		take: options.take,
	}) as Promise<GetMultipleResult<S, I>>;
}

async function update(requestId: string, data: Prisma.FolderUpdateInput) {
	const folder = await prisma.verifyEmailRequest.update({
		where: { id: requestId },
		data,
	});

	return folder;
}

async function del(token: string) {
	await prisma.verifyEmailRequest.delete({
		where: { token },
	});
}

async function delMany(payload: Prisma.VerifyEmailRequestDeleteManyArgs) {
	await prisma.verifyEmailRequest.deleteMany(payload);
}

export const VerifyEmailRequestService = {
	create,
	get,
	getMultiple,
	update,
	delete: del,
	deleteMany: delMany,
};
