import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse, URLPattern } from 'next/server';
import { routing } from './i18n/routing';
import { auth } from "@/actions/auth";
import { isValidShareLink } from './lib/checkLinks';

const publicPages = [
    '/',
    '/(fr|en)/signin',
    '/(fr|en)/account/.*',
    '/api/auth/signin',
    '/api/auth/signout',
    '/(fr|en)/emails'
];
const locales = ['en', 'fr'];
const defaultLocale = 'en';

const handleI18nRouting = createMiddleware(routing);

/*const authMiddleware = auth(
    // Note that this callback is only invoked if
    // the `authorized` callback has returned `true`
    // and not for pages listed in `pages`.
    (req) => {
        return handleI18nRouting(req);
    }
);*/

const PATTERNS: [URLPattern, ({ pathname }: { pathname: any }) => any][] = [
    [
        new URLPattern({ pathname: '/:locale/dashboard/folders/:folderId' }),
        ({ pathname }: { pathname: any }) => {
            return pathname.groups
        }
    ]
]

const params = (url: string): any => {
    const input = url.split('?')[0]
    let result = {}

    for (const [pattern, handler] of PATTERNS) {
        const patternResult = pattern.exec(input)
        if (patternResult !== null && 'pathname' in patternResult) {
            result = handler(patternResult)
            break
        }
    }
    return result
}

export async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const session = await auth();
    const locale = getLocaleFromUrl(req.nextUrl);

    if (!locales.some((loc) => pathname.startsWith(`/${loc}`))) {
        console.log("Move to locale req.url:", req.url);
        console.log(req.nextUrl.search);
        const redirectUrl = new URL(`/${locale}${pathname}${req.nextUrl.search}`, req.url);
        console.log("RedirectUrl:", redirectUrl.toString());
        return NextResponse.redirect(redirectUrl);
    }

    const publicPathnameRegex = RegExp(
        `^(/(${locales.join('|')}))?(${publicPages
            .flatMap((p) => (p === '/' ? ['', '/'] : p))
            .join('|')})/?$`,
        'i'
    );

    if (RegExp(`^/(${locales.join('|')})/signin$`).test(pathname) && session?.user) {
        if (req.nextUrl.searchParams.get("callbackUrl") === null) {
            console.log("Redirect with callback");
            return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/${locale}/dashboard`);
        }
        return NextResponse.redirect(req.nextUrl.searchParams.get("callbackUrl")!);
    }

    if (RegExp(`^/(${locales.join('|')})/signin$`).test(pathname) && req.nextUrl.searchParams.get("callbackUrl") === null) {
        const defaultSignInUrl = new URL(`/${locale}/signin?callbackUrl=${process.env.NEXTAUTH_URL}/${locale}/dashboard${req.nextUrl.search.replace("?", "&")}`, req.url);
        return NextResponse.redirect(defaultSignInUrl);
    }

    if (publicPathnameRegex.test(pathname)) {
        return handleI18nRouting(req);
    }

    if (req.nextUrl.searchParams.get("share") && await isValidShareLink(params(req.url).folderId, req.nextUrl.searchParams.get("share"))) {
        await fetch(`${process.env.NEXTAUTH_URL}/api/tokens/increment?token=${req.nextUrl.searchParams.get("share")}`);

        return handleI18nRouting(req);
    }

    if (!session?.user) {
        const signInUrl = new URL(`/${locale}/signin?callbackUrl=${process.env.NEXTAUTH_URL}${pathname}${req.nextUrl.search.replace("?", "&")}`, req.url);
        return NextResponse.redirect(signInUrl);
    }

    return handleI18nRouting(req);
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)']
};

function getLocaleFromUrl(url: URL) {
    const locale = url.pathname.split('/')[1];
    return locales.includes(locale) ? locale : defaultLocale;
}
