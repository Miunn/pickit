import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {routing} from './i18n/routing';
import {auth} from "@/actions/auth";

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

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const session = await auth();
    const locale = getLocaleFromUrl(req.nextUrl);

    if (!locales.some((loc) => pathname.startsWith(`/${loc}`))) {
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
        return handleI18nRouting(req);
    }

    if (!session?.user) {
        const signInUrl = new URL(`/${locale}/signin?callbackUrl=${process.env.NEXTAUTH_URL}${pathname}`, req.url);
        return NextResponse.redirect(signInUrl);
    }

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
