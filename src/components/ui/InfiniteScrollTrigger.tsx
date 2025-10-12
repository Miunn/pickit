"use client";

import { useEffect, useRef, useCallback } from "react";

interface InfiniteScrollTriggerProps {
    onLoadMoreAction: () => void;
    hasMore: boolean;
    loading?: boolean;
    threshold?: number;
    rootMargin?: string;
}

export const InfiniteScrollTrigger = ({
    onLoadMoreAction,
    hasMore,
    loading = false,
    threshold = 0.1,
    rootMargin = "200px",
}: InfiniteScrollTriggerProps) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const isTriggeredRef = useRef(false);
    const wasIntersectingRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const cleanupObserver = useCallback(() => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const handleIntersection = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;

            // Track current visibility to detect rising edge only
            const isNowIntersecting = entry.isIntersecting;
            const wasIntersecting = wasIntersectingRef.current;
            wasIntersectingRef.current = isNowIntersecting;

            // Only trigger on rising edge: transitioned from not visible -> visible
            if (isNowIntersecting && !wasIntersecting && !isTriggeredRef.current && !loading && hasMore) {
                isTriggeredRef.current = true;
                // Small debounce to prevent rapid firing
                timeoutRef.current = setTimeout(() => {
                    onLoadMoreAction();
                }, 50);
            }
        },
        [onLoadMoreAction, loading, hasMore]
    );

    const setupObserver = useCallback(() => {
        const triggerElement = triggerRef.current;
        if (!triggerElement || !hasMore) return;

        cleanupObserver();

        // Initialize last-known visibility so we only fire on rising edge
        const rect = triggerElement.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const inViewport =
            rect.top < viewportHeight && rect.bottom >= 0 && rect.left < viewportWidth && rect.right >= 0;
        wasIntersectingRef.current = inViewport;

        observerRef.current = new IntersectionObserver(handleIntersection, {
            threshold,
            rootMargin,
        });

        observerRef.current.observe(triggerElement);
    }, [handleIntersection, hasMore, threshold, rootMargin, cleanupObserver]);

    // Setup observer when conditions change
    useEffect(() => {
        // Reset trigger state when loading completes and we still have more items
        if (!loading && hasMore && isTriggeredRef.current) {
            isTriggeredRef.current = false;
        }

        // Only setup observer if we have more items and aren't already triggered
        if (hasMore && !isTriggeredRef.current) {
            setupObserver();

            // If the sentinel is already visible after appending, trigger immediately once
            const el = triggerRef.current;
            if (el && !loading) {
                const rect = el.getBoundingClientRect();
                const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
                const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                const inViewport =
                    rect.top < viewportHeight && rect.bottom >= 0 && rect.left < viewportWidth && rect.right >= 0;
                if (inViewport && !isTriggeredRef.current) {
                    isTriggeredRef.current = true;
                    timeoutRef.current = setTimeout(() => {
                        onLoadMoreAction();
                    }, 0);
                }
            }
        }

        return cleanupObserver;
    }, [hasMore, loading, setupObserver, cleanupObserver, onLoadMoreAction]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupObserver();
        };
    }, [cleanupObserver]);

    if (!hasMore) return null;

    return (
        <div ref={triggerRef} className="w-full py-6 flex items-center justify-center min-h-[60px]">
            {loading && (
                <div className="flex items-center space-x-3 text-muted-foreground">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                    <span className="text-sm font-medium">Loading more images...</span>
                </div>
            )}
        </div>
    );
};
