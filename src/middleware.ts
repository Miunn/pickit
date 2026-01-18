import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const locales = ["en", "fr"];
const defaultLocale = "en";

const handleI18nRouting = createMiddleware(routing);

export default async function middleware(req: NextRequest) {
	const pathname = req.nextUrl.pathname;
	const locale = getLocaleFromUrl(req.nextUrl);

	if (!locales.some(loc => pathname.startsWith(`/${loc}`))) {
		const redirectUrl = new URL(`/${locale}${pathname}${req.nextUrl.search}`, req.url);
		return NextResponse.redirect(redirectUrl);
	}

	if (req.method === "GET") {
		const response = handleI18nRouting(req);
		response.headers.set("X-Pathname", pathname);
		const token = req.cookies.get("session")?.value ?? null;
		if (token !== null) {
			// Only extend cookie expiration on GET requests since we can be sure
			// a new session wasn't set when handling the request.
			response.cookies.set("session", token, {
				path: "/",
				maxAge: 60 * 60 * 24 * 30,
				sameSite: "lax",
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
			});
		}
		return response;
	}

	// ########################### CSRF Protection ###################################
	if (req.method === "GET") {
		const reqHeaders = new Headers(req.headers);
		reqHeaders.set("X-Pathname", pathname);
		return NextResponse.next({
			headers: reqHeaders,
		});
	}
	const originHeader = req.headers.get("Origin");
	// NOTE: You may need to use `X-Forwarded-Host` instead
	const hostHeader = req.headers.get("Host");
	if (originHeader === null || hostHeader === null) {
		return new NextResponse(null, {
			status: 403,
		});
	}
	let origin: URL;
	try {
		origin = new URL(originHeader);
	} catch {
		return new NextResponse(null, {
			status: 403,
		});
	}
	if (origin.host !== hostHeader) {
		return new NextResponse(null, {
			status: 403,
		});
	}

	// ###############################################################################

	return handleI18nRouting(req);
}

export const config = {
	matcher: ["/((?!api|_next|.*\\..*).*)"],
};

function getLocaleFromUrl(url: URL) {
	const locale = url.pathname.split("/")[1];
	return locales.includes(locale) ? locale : defaultLocale;
}
