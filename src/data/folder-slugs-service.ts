import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Define types for better overload handling
type GetOptions<
	S extends Prisma.FolderSlugSelect | undefined = undefined,
	I extends Prisma.FolderSlugInclude | undefined = undefined,
> = {
	where: Prisma.FolderSlugWhereUniqueInput;
} & (S extends Prisma.FolderSlugSelect ? { select: S } : object) &
	(I extends Prisma.FolderSlugInclude ? { include: I } : object);

type GetResult<
	S extends Prisma.FolderSlugSelect | undefined,
	I extends Prisma.FolderSlugInclude | undefined,
> = S extends Prisma.FolderSlugSelect
	? Prisma.FolderSlugGetPayload<{ select: S }>
	: I extends Prisma.FolderSlugInclude
		? Prisma.FolderSlugGetPayload<{ include: I }>
		: Prisma.FolderSlugGetPayload<object>;

// Overloaded function using generic constraints
function get<
	S extends Prisma.FolderSlugSelect | undefined = undefined,
	I extends Prisma.FolderSlugInclude | undefined = undefined,
>(options: GetOptions<S, I>): Promise<GetResult<S, I> | null> {
	return prisma.folderSlug.findUnique({
		where: options.where,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
	}) as Promise<GetResult<S, I> | null>;
}

// Define types for getMultiple
type GetMultipleOptions<
	S extends Prisma.FolderSlugSelect | undefined = undefined,
	I extends Prisma.FolderSlugInclude | undefined = undefined,
> = {
	where: Prisma.FolderSlugWhereInput;
	orderBy?: Prisma.Enumerable<Prisma.FolderSlugOrderByWithRelationInput>;
	take?: number;
} & (S extends Prisma.FolderSlugSelect ? { select: S } : object) &
	(I extends Prisma.FolderSlugInclude ? { include: I } : object);

type GetMultipleResult<
	S extends Prisma.FolderSlugSelect | undefined,
	I extends Prisma.FolderSlugInclude | undefined,
> = S extends Prisma.FolderSlugSelect
	? Prisma.FolderSlugGetPayload<{ select: S }>[]
	: I extends Prisma.FolderSlugInclude
		? Prisma.FolderSlugGetPayload<{ include: I }>[]
		: Prisma.FolderSlugGetPayload<object>[];

// Overloaded function using generic constraints
function getMultiple<
	S extends Prisma.FolderSlugSelect | undefined = undefined,
	I extends Prisma.FolderSlugInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
	return prisma.folderSlug.findMany({
		where: options.where,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
		orderBy: options.orderBy,
		take: options.take,
	}) as Promise<GetMultipleResult<S, I>>;
}

export const FolderSlugsService = {
	get,
	getMultiple,
};
