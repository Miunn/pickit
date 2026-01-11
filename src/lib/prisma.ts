import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
	// On create image or video, we update the folder size
	// On delete image or video, we update the folder size
	// On create image or video, we update user usedStorage
	// On delete image or video, we update user usedStorage
	return new PrismaClient({
		omit: {
			user: {
				password: true,
			},
			accessToken: {
				pinCode: true,
			},
		},
	}).$extends({
		query: {
			folder: {
				delete: async ({ args, query }) => {
					const result = await query(args);
					await prisma.user.update({
						where: { id: result.createdById },
						data: { usedStorage: { decrement: result.size } },
					});
				},
			},
			file: {
				create: async ({ args, query }) => {
					const result = await query(args);
					const folderId =
						result.folderId ||
						args.data.folderId ||
						result.folder?.id ||
						args.data.folder?.connect?.id;
					const userId =
						result.createdById ||
						args.data.createdById ||
						result.createdBy?.id ||
						args.data.createdBy?.connect?.id;
					await prisma.folder.update({
						where: { id: folderId },
						data: { size: { increment: args.data.size } },
					});
					await prisma.user.update({
						where: { id: userId },
						data: { usedStorage: { increment: args.data.size } },
					});
					return result;
				},
				delete: async ({ args, query }) => {
					const result = await query(args);
					await prisma.folder.update({
						where: { id: result.folderId },
						data: { size: { decrement: result.size } },
					});
					await prisma.user.update({
						where: { id: result.createdById },
						data: { usedStorage: { decrement: result.size } },
					});
					return result;
				},
			},
		},
	});
};

declare const globalThis: {
	prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
