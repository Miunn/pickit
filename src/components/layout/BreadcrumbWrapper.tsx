'use client';

import { usePathname } from 'next/navigation';
import HeaderBreadcumb from './HeaderBreadcumb';

export default function BreadcrumbWrapper() {
    const pathname = usePathname();
    const isFolderPage = pathname?.includes('/app/folders/');

    if (isFolderPage) return null;

    return <HeaderBreadcumb />;
} 