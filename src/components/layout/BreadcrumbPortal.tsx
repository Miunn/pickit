'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

export default function BreadcrumbPortal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const breadcrumbContainer = document.getElementById('breadcrumb-container');
    if (!breadcrumbContainer) return null;

    return createPortal(children, breadcrumbContainer);
} 