import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/data/session";
import { Prisma } from "@prisma/client";

async function create(data: Prisma.PasswordResetRequestCreateInput) {
	const { user } = await getCurrentSession();

	const folder = await prisma.passwordResetRequest.create({
		data: {
			...data,
			userId: undefined,
			user: { connect: { id: user?.id } },
		},
	});

	return folder;
}

// Define types for better overload handling
type GetOptions<
	S extends Prisma.PasswordResetRequestSelect | undefined = undefined,
	I extends Prisma.PasswordResetRequestInclude | undefined = undefined,
> = {
	where: Prisma.PasswordResetRequestWhereUniqueInput;
} & (S extends Prisma.PasswordResetRequestSelect ? { select: S } : object) &
	(I extends Prisma.PasswordResetRequestInclude ? { include: I } : object);

type GetResult<
	S extends Prisma.PasswordResetRequestSelect | undefined,
	I extends Prisma.PasswordResetRequestInclude | undefined,
> = S extends Prisma.PasswordResetRequestSelect
	? Prisma.PasswordResetRequestGetPayload<{ select: S }>
	: I extends Prisma.PasswordResetRequestInclude
		? Prisma.PasswordResetRequestGetPayload<{ include: I }>
		: Prisma.PasswordResetRequestGetPayload<object>;

// Overloaded function using generic constraints
function get<
	S extends Prisma.PasswordResetRequestSelect | undefined = undefined,
	I extends Prisma.PasswordResetRequestInclude | undefined = undefined,
>(options: GetOptions<S, I>): Promise<GetResult<S, I> | null> {
	return prisma.passwordResetRequest.findUnique({
		where: options.where,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
	}) as Promise<GetResult<S, I> | null>;
}

// Define types for getMultiple
type GetMultipleOptions<
	S extends Prisma.PasswordResetRequestSelect | undefined = undefined,
	I extends Prisma.PasswordResetRequestInclude | undefined = undefined,
> = {
	where: Prisma.PasswordResetRequestWhereInput;
	orderBy?: Prisma.Enumerable<Prisma.FolderOrderByWithRelationInput>;
	take?: number;
} & (S extends Prisma.PasswordResetRequestSelect ? { select: S } : object) &
	(I extends Prisma.PasswordResetRequestInclude ? { include: I } : object);

type GetMultipleResult<
	S extends Prisma.PasswordResetRequestSelect | undefined,
	I extends Prisma.PasswordResetRequestInclude | undefined,
> = S extends Prisma.PasswordResetRequestSelect
	? Prisma.PasswordResetRequestGetPayload<{ select: S }>[]
	: I extends Prisma.PasswordResetRequestInclude
		? Prisma.PasswordResetRequestGetPayload<{ include: I }>[]
		: Prisma.PasswordResetRequestGetPayload<object>[];

// Overloaded function using generic constraints
function getMultiple<
	S extends Prisma.PasswordResetRequestSelect | undefined = undefined,
	I extends Prisma.PasswordResetRequestInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
	return prisma.passwordResetRequest.findMany({
		where: options.where,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
		orderBy: options.orderBy,
		take: options.take,
	}) as Promise<GetMultipleResult<S, I>>;
}

async function update(token: string, data: Prisma.PasswordResetRequestUpdateInput) {
	const folder = await prisma.passwordResetRequest.update({
		where: { token },
		data,
	});

	return folder;
}

async function del(folderId: string) {
	await prisma.passwordResetRequest.delete({
		where: { id: folderId },
	});
}

async function delMany(payload: Prisma.PasswordResetRequestDeleteManyArgs) {
	await prisma.passwordResetRequest.deleteMany(payload);
}

export const PasswordResetRequestService = {
	create,
	get,
	getMultiple,
	update,
	delete: del,
	deleteMany: delMany,
};
