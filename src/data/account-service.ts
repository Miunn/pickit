import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

export const AccountService = {
	get,
};
