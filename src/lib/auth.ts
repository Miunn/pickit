import { betterAuth } from "better-auth";
import { admin as adminPlugin } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { transporter } from "./mailing";
import { MailTemplate, renderMailTemplate } from "./mail-renderer";
import { ac, admin, user } from "@/lib/permissions";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	trustedOrigins: [
		process.env.NEXT_PUBLIC_APP_URL,
		"https://*.run.app",
		"http://localhost:3000",
	].filter(Boolean) as string[],
	advanced: {
		trustedProxyHeaders: true,
		// Firebase Hosting only forwards a cookie named `__session` to Cloud Run.
		// Do not use the `__Secure-` name prefix or Hosting will strip it.
		useSecureCookies: false,
		defaultCookieAttributes: {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
		},
		cookies: {
			session_token: {
				name: "__session",
			},
		},
	},
	plugins: [
		adminPlugin({
			ac,
			roles: { admin, user },
		}),
	],
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			const emailHtml = await renderMailTemplate(MailTemplate.ResetPassword, user, url);
			transporter.sendMail({
				from: `"The Echomori Team" <${process.env.MAIL_SENDER}>`,
				to: user.email,
				subject: "Reset your password",
				text: "Reset your password",
				html: emailHtml,
			});
		},
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			const emailHtml = await renderMailTemplate(MailTemplate.VerifyEmail, user, url);
			transporter.sendMail({
				from: `"The Echomori Team" <${process.env.MAIL_SENDER}>`,
				to: user.email,
				subject: "Verify your email",
				html: emailHtml,
			});
		},
		sendOnSignIn: true,
	},
	socialProviders: {
		google: {
			clientId: process.env.OAUTH_GOOGLE_CLIENT_ID!,
			clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET!,
		},
	},
	user: {
		additionalFields: {
			usedStorage: {
				type: "number",
				bigint: true,
				defaultValue: 0,
			},
			maxStorage: {
				type: "number",
				bigint: true,
				defaultValue: 5000,
			},
		},
	},
});

export type Session = typeof auth.$Infer.Session;
export type User = (typeof auth.$Infer.Session)["user"];
