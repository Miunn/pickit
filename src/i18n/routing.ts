import {defineRouting} from 'next-intl/routing';
import {createSharedPathnamesNavigation} from 'next-intl/navigation';
import {RoutingConfig} from "next-intl/dist/types/src/routing/config";

export const routing: RoutingConfig<any, any> = defineRouting({
    locales: ['en', 'fr'],
    defaultLocale: 'en',
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const {Link, redirect, usePathname, useRouter} =
    createSharedPathnamesNavigation(routing);
