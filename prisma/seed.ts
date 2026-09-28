import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SeedUser = {
	email: string;
	password: string;
	name: string;
	role?: string;
};

async function ensureUser({ email, password, name, role }: SeedUser) {
	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		console.log(`Skipping existing user: ${email}`);
		return existing;
	}

	const { user } = await auth.api.createUser({
		body: {
			email,
			password,
			name,
			role,
			data: { emailVerified: true },
		},
	});

	console.log(`Created user: ${email}`);
	return user;
}

async function main() {
	if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
		console.log("Seed skipped in production (set ALLOW_PRODUCTION_SEED=true to override).");
		return;
	}

	await ensureUser({
		email: process.env.SEED_ADMIN_EMAIL ?? "admin@localhost.dev",
		password: process.env.SEED_ADMIN_PASSWORD ?? "Admin123!",
		name: process.env.SEED_ADMIN_NAME ?? "Admin",
		role: "admin",
	});

	await ensureUser({
		email: process.env.SEED_USER_EMAIL ?? "user@localhost.dev",
		password: process.env.SEED_USER_PASSWORD ?? "User123!",
		name: process.env.SEED_USER_NAME ?? "Demo User",
		role: "user",
	});
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
