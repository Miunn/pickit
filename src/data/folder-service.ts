import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { Prisma } from "@prisma/client";
import slugify from "slugify";

async function create(data: Omit<Prisma.FolderCreateInput, "slug">) {
	const { user } = await getCurrentSession();

	const { name, ...rest } = data;

	const slug = slugify(name, { lower: true, strict: true });

	const suffixRandomChars = Math.random().toString(36).substring(2, 7);
	const uniqueSlug = `${slug}-${suffixRandomChars}`;

	const isSlugTaken = await prisma.folder.findUnique({
		where: { slug: uniqueSlug },
	});

	if (isSlugTaken) {
		throw new Error("Folder with this slug already exists. Please try again.");
	}

	const folder = await prisma.folder.create({
		data: {
			name,
			slug: uniqueSlug,
			...rest,
			createdBy: {
				connect: { id: user?.id },
			},
		},
	});

	return folder;
}

// Define types for better overload handling
type GetOptions<
	S extends Prisma.FolderSelect | undefined = undefined,
	I extends Prisma.FolderInclude | undefined = undefined,
> = {
	where: Prisma.FolderWhereUniqueInput;
} & (S extends Prisma.FolderSelect ? { select: S } : object) &
	(I extends Prisma.FolderInclude ? { include: I } : object);

type GetResult<
	S extends Prisma.FolderSelect | undefined,
	I extends Prisma.FolderInclude | undefined,
> = S extends Prisma.FolderSelect
	? Prisma.FolderGetPayload<{ select: S }>
	: I extends Prisma.FolderInclude
		? Prisma.FolderGetPayload<{ include: I }>
		: Prisma.FolderGetPayload<object>;

// Overloaded function using generic constraints
function get<
	S extends Prisma.FolderSelect | undefined = undefined,
	I extends Prisma.FolderInclude | undefined = undefined,
>(options: GetOptions<S, I>): Promise<GetResult<S, I> | null> {
	return prisma.folder.findUnique({
		where: options.where,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
	}) as Promise<GetResult<S, I> | null>;
}

// Define types for getMultiple
type GetMultipleOptions<
	S extends Prisma.FolderSelect | undefined = undefined,
	I extends Prisma.FolderInclude | undefined = undefined,
> = {
	where: Prisma.FolderWhereInput;
	orderBy?: Prisma.Enumerable<Prisma.FolderOrderByWithRelationInput>;
	take?: number;
} & (S extends Prisma.FolderSelect ? { select: S } : object) &
	(I extends Prisma.FolderInclude ? { include: I } : object);

type GetMultipleResult<
	S extends Prisma.FolderSelect | undefined,
	I extends Prisma.FolderInclude | undefined,
> = S extends Prisma.FolderSelect
	? Prisma.FolderGetPayload<{ select: S }>[]
	: I extends Prisma.FolderInclude
		? Prisma.FolderGetPayload<{ include: I }>[]
		: Prisma.FolderGetPayload<object>[];

// Overloaded function using generic constraints
function getMultiple<
	S extends Prisma.FolderSelect | undefined = undefined,
	I extends Prisma.FolderInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
	return prisma.folder.findMany({
		where: options.where,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
		orderBy: options.orderBy,
		take: options.take,
	}) as Promise<GetMultipleResult<S, I>>;
}

async function update(folderId: string, data: Prisma.FolderUpdateInput) {
	const folder = await prisma.folder.update({
		where: { id: folderId },
		data,
	});

	return folder;
}

async function del(folderId: string) {
	await prisma.folder.delete({
		where: { id: folderId },
	});
}

export const FolderService = {
	create,
	get,
	getMultiple,
	update,
	delete: del,
};
