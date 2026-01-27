import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/data/session";
import { Prisma } from "@prisma/client";

async function create(data: Prisma.NotificationCreateInput) {
	const { user } = await getCurrentSession();

	if (!user) {
		throw new Error("Access denied");
	}

	const folder = await prisma.notification.create({
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
	S extends Prisma.NotificationSelect | undefined = undefined,
	I extends Prisma.NotificationInclude | undefined = undefined,
> = {
	where: Prisma.NotificationWhereUniqueInput;
} & (S extends Prisma.NotificationSelect ? { select: S } : object) &
	(I extends Prisma.NotificationInclude ? { include: I } : object);

type GetResult<
	S extends Prisma.NotificationSelect | undefined,
	I extends Prisma.NotificationInclude | undefined,
> = S extends Prisma.NotificationSelect
	? Prisma.NotificationGetPayload<{ select: S }>
	: I extends Prisma.NotificationInclude
		? Prisma.NotificationGetPayload<{ include: I }>
		: Prisma.NotificationGetPayload<object>;

// Overloaded function using generic constraints
function get<
	S extends Prisma.NotificationSelect | undefined = undefined,
	I extends Prisma.NotificationInclude | undefined = undefined,
>(options: GetOptions<S, I>): Promise<GetResult<S, I> | null> {
	return prisma.notification.findUnique({
		where: options.where,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
	}) as Promise<GetResult<S, I> | null>;
}

// Define types for getMultiple
type GetMultipleOptions<
	S extends Prisma.NotificationSelect | undefined = undefined,
	I extends Prisma.NotificationInclude | undefined = undefined,
> = {
	where: Prisma.NotificationWhereInput;
	orderBy?: Prisma.Enumerable<Prisma.NotificationOrderByWithRelationInput>;
	take?: number;
} & (S extends Prisma.NotificationSelect ? { select: S } : object) &
	(I extends Prisma.NotificationInclude ? { include: I } : object);

type GetMultipleResult<
	S extends Prisma.NotificationSelect | undefined,
	I extends Prisma.NotificationInclude | undefined,
> = S extends Prisma.NotificationSelect
	? Prisma.NotificationGetPayload<{ select: S }>[]
	: I extends Prisma.NotificationInclude
		? Prisma.NotificationGetPayload<{ include: I }>[]
		: Prisma.NotificationGetPayload<object>[];

// Overloaded function using generic constraints
function getMultiple<
	S extends Prisma.NotificationSelect | undefined = undefined,
	I extends Prisma.NotificationInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
	return prisma.notification.findMany({
		where: options.where,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
		orderBy: options.orderBy,
		take: options.take,
	}) as Promise<GetMultipleResult<S, I>>;
}

async function update(folderId: string, data: Prisma.NotificationUpdateInput) {
	const folder = await prisma.notification.update({
		where: { id: folderId },
		data,
	});

	return folder;
}

// Function overloads for updateMany
async function updateMany(
	where: Prisma.NotificationWhereInput,
	data: Prisma.NotificationUpdateManyMutationInput
): Promise<Prisma.BatchPayload>;
async function updateMany<I extends Prisma.NotificationInclude>(
	where: Prisma.NotificationWhereInput,
	data: Prisma.NotificationUpdateManyMutationInput,
	include: I
): Promise<Prisma.NotificationGetPayload<{ include: I }>[]>;
async function updateMany(
	where: Prisma.NotificationWhereInput,
	data: Prisma.NotificationUpdateManyMutationInput,
	include?: Prisma.NotificationInclude
): Promise<Prisma.BatchPayload | Prisma.NotificationGetPayload<{ include?: Prisma.NotificationInclude }>[]> {
	if (include) {
		// When include is provided, we need to first find the records, then update them individually
		const notifications = await prisma.notification.findMany({
			where,
			include,
		});

		const updatedNotifications = await Promise.all(
			notifications.map(notification =>
				prisma.notification.update({
					where: { id: notification.id },
					data,
					include,
				})
			)
		);

		return updatedNotifications;
	} else {
		// When no include is provided, use the efficient updateMany operation
		const result = await prisma.notification.updateMany({
			where,
			data,
		});

		return result;
	}
}

async function del(notificationId: string) {
	await prisma.notification.delete({
		where: { id: notificationId },
	});
}

export const NotificationService = {
	create,
	get,
	getMultiple,
	update,
	updateMany,
	delete: del,
};
