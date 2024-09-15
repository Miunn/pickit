import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {routing} from './i18n/routing';
import {auth} from "@/actions/auth";
import {getLocalePrefix} from "next-intl/dist/types/src/shared/utils";

const publicPages = ['/', '/(fr|en)/signin', '/api/auth/signin', '/api/auth/signout'];
const locales = ['en', 'fr'];
const defaultLocale = 'en';

const handleI18nRouting = createMiddleware(routing);

const authMiddleware = auth(
    // Note that this callback is only invoked if
    // the `authorized` callback has returned `true`
    // and not for pages listed in `pages`.
    (req) =>{
        return handleI18nRouting(req);
    }
);

/*export default function middleware(req: NextRequest) {
    const publicPathnameRegex = RegExp(
        `^(/(${locales.join('|')}))?(${publicPages
            .flatMap((p) => (p === '/' ? ['', '/'] : p))
            .join('|')})/?$`,
        'i'
    );
    const isPublicPage = publicPathnameRegex.test(req.nextUrl.pathname);

    console.log('Middleware request', req.nextUrl.pathname);
    //
    if (isPublicPage) {
        console.log('Public page request');
        return handleI18nRouting(req);
    } else {
        console.log('Private page request');
        return (authMiddleware as any)(req);
    }
}*/

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    const session = await auth();

    const locale = getLocaleFromUrl(req.nextUrl);

    console.log("Pathname:", pathname);
    console.log("Locale:", locale);

    if (!locales.some((loc) => pathname.startsWith(`/${loc}`))) {
        console.log("Redirecting to locale");
        const redirectUrl = new URL(`/${locale}${pathname}`, req.url);
        return NextResponse.redirect(redirectUrl);
    }

    const publicPathnameRegex = RegExp(
        `^(/(${locales.join('|')}))?(${publicPages
            .flatMap((p) => (p === '/' ? ['', '/'] : p))
            .join('|')})/?$`,
        'i'
    );

    if (publicPathnameRegex.test(pathname)) {
        console.log("Public page request");
        return handleI18nRouting(req);
    }

    if (!session?.user) {
        console.log("Redirecting to sign in");
        const signInUrl = new URL(`/${locale}/signin?callbackUrl=${process.env.NEXTAUTH_URL}${pathname}`, req.url);
        return NextResponse.redirect(signInUrl);
    }

    console.log("Private page request");
    return handleI18nRouting(req);
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)']
};

// Helper function to get locale from the request
function getLocaleFromRequest(req: NextRequest) {
    const acceptLanguage = req.headers.get('accept-language') || '';
    const preferredLocale = acceptLanguage.split(',')[0];
    return locales.includes(preferredLocale) ? preferredLocale : null;
}

function getLocaleFromUrl(url: URL) {
    const locale = url.pathname.split('/')[1];
    return locales.includes(locale) ? locale : defaultLocale;
}
