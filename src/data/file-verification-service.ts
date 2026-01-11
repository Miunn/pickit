import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

async function create(
	data: Prisma.FileVerificationMetadataCreateInput
): Promise<Prisma.FileVerificationMetadataGetPayload<object>>;
async function create<I extends Prisma.FileVerificationMetadataInclude>(
	data: Prisma.FileVerificationMetadataCreateInput,
	include: I
): Promise<Prisma.FileVerificationMetadataGetPayload<{ include: I }>>;
function create(
	data: Prisma.FileVerificationMetadataCreateInput,
	include?: Prisma.FileVerificationMetadataInclude
): Promise<Prisma.FileVerificationMetadataGetPayload<{ include?: Prisma.FileVerificationMetadataInclude }>> {
	return prisma.fileVerificationMetadata.create({
		data,
		include,
	});
}

// Define types for better overload handling
type GetOptions<
	S extends Prisma.FileVerificationMetadataSelect | undefined = undefined,
	I extends Prisma.FileVerificationMetadataInclude | undefined = undefined,
> = {
	method?: "unique";
	where: Prisma.FileVerificationMetadataWhereUniqueInput;
} & (S extends Prisma.FileVerificationMetadataSelect ? { select: S } : object) &
	(I extends Prisma.FileVerificationMetadataInclude ? { include: I } : object);

type GetFirstOptions<
	S extends Prisma.FileVerificationMetadataSelect | undefined = undefined,
	I extends Prisma.FileVerificationMetadataInclude | undefined = undefined,
> = {
	where: Prisma.FileVerificationMetadataWhereInput;
	method?: "first";
	orderBy?: Prisma.Enumerable<Prisma.FileVerificationMetadataOrderByWithRelationInput>;
} & (S extends Prisma.FileVerificationMetadataSelect ? { select: S } : object) &
	(I extends Prisma.FileVerificationMetadataInclude ? { include: I } : object);

type GetResult<
	S extends Prisma.FileVerificationMetadataSelect | undefined,
	I extends Prisma.FileVerificationMetadataInclude | undefined,
> = S extends Prisma.FileVerificationMetadataSelect
	? Prisma.FileVerificationMetadataGetPayload<{ select: S }>
	: I extends Prisma.FileVerificationMetadataInclude
		? Prisma.FileVerificationMetadataGetPayload<{ include: I }>
		: Prisma.FileVerificationMetadataGetPayload<object>;

// Overloaded function using generic constraints
function get<
	S extends Prisma.FileVerificationMetadataSelect | undefined = undefined,
	I extends Prisma.FileVerificationMetadataInclude | undefined = undefined,
>(options: GetOptions<S, I> | GetFirstOptions<S, I>): Promise<GetResult<S, I> | null> {
	if (options.method === "first") {
		return prisma.fileVerificationMetadata.findFirst({
			where: options.where,
			select: "select" in options ? options.select : undefined,
			include: "include" in options ? options.include : undefined,
		}) as Promise<GetResult<S, I> | null>;
	}

	return prisma.fileVerificationMetadata.findUnique({
		where: options.where as Prisma.FileVerificationMetadataWhereUniqueInput,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
	}) as Promise<GetResult<S, I> | null>;
}

async function del(id: string) {
	await prisma.fileVerificationMetadata.delete({
		where: { id: id },
	});
}

async function delFromFile(fileId: string) {
	await prisma.fileVerificationMetadata.deleteMany({
		where: { fileId: fileId },
	});
}

export const FileVerificationService = {
	create,
	get,
	delete: del,
	deleteFromFile: delFromFile,
};
