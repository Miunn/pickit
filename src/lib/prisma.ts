import { PrismaClient } from "@prisma/client";

function prismaDatabaseUrl() {
	const url = process.env.DATABASE_URL;
	if (!url) {
		return url;
	}

	const [base, query = ""] = url.split("?");
	const params = new URLSearchParams(query);
	// Transaction poolers (Supabase :6543) reuse backends. Prisma prepared
	// statements then collide with 42P05 unless this flag is set.
	params.set("pgbouncer", "true");
	if (!params.has("connection_limit")) {
		params.set("connection_limit", "5");
	}
	if (/supabase\.(co|com)|pooler\.supabase/.test(url) && !params.has("sslmode")) {
		params.set("sslmode", "require");
	}
	return `${base}?${params.toString()}`;
}

const prismaClientSingleton = () => {
	// On create image or video, we update the folder size
	// On delete image or video, we update the folder size
	// On create image or video, we update user usedStorage
	// On delete image or video, we update user usedStorage
	return new PrismaClient({
		datasources: {
			db: {
				url: prismaDatabaseUrl(),
			},
		},
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
