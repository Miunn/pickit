import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { SlugService } from "@/data/slug-service";

async function create(data: Omit<Prisma.FolderCreateInput, "slug">) {
	const { name, ...rest } = data;

	const slug = SlugService.generateSlug(name.toString(), true);

	try {
		const folder = await prisma.folder.create({
			data: {
				name,
				slug,
				...rest,
				slugs: {
					create: { slug },
				},
			},
		});
		return folder;
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") {
				throw new Error("slug-taken");
			}
		}
		throw new Error("unknown-error");
	}
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
	const { name, ...rest } = data;

	const nameValue = typeof name === "string" ? name : name?.set;

	const slug = nameValue ? SlugService.generateSlug(nameValue, true) : undefined;

	const folder = await prisma.folder.update({
		where: { id: folderId },
		data: {
			name,
			slug,
			...rest,
			slugs: {
				create: slug ? { slug } : undefined,
			},
		},
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
