"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ContextFile } from "@/context/FilesContext";
import { ImagesSortMethod } from "@/types/imagesSort";

interface PaginationInfo {
    page: number;
    limit: number;
    totalFiles: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface UseInfiniteFilesOptions {
    folderId: string;
    sortMethod: ImagesSortMethod;
    initialFiles?: ContextFile[];
    limit?: number;
    shareToken?: string;
    hashToken?: string;
}

interface UseInfiniteFilesReturn {
    files: ContextFile[];
    loading: boolean;
    error: string | null;
    hasNextPage: boolean;
    loadMore: () => Promise<void>;
    refreshFiles: () => Promise<void>;
    setFiles: React.Dispatch<React.SetStateAction<ContextFile[]>>;
}

export function useInfiniteFiles({
    folderId,
    sortMethod,
    initialFiles = [],
    limit = 20,
    shareToken,
    hashToken,
}: UseInfiniteFilesOptions): UseInfiniteFilesReturn {
    const [files, setFiles] = useState<ContextFile[]>(initialFiles);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: initialFiles.length > 0 ? 1 : 0,
        limit,
        totalFiles: initialFiles.length,
        totalPages: Math.ceil(initialFiles.length / limit),
        // If we received initial files, we cannot know if there are more.
        // Assume there are more to allow loading additional pages; server will correct on first response.
        hasNextPage: initialFiles.length > 0 ? true : true,
        hasPrevPage: false,
    });
    const loadingRef = useRef(false);

    const fetchFiles = useCallback(
        async (page: number, append: boolean = false) => {
            if (loadingRef.current) {
                return;
            }

            loadingRef.current = true;
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    sort: sortMethod,
                });

                if (shareToken) {
                    params.append("share", shareToken);
                }

                if (hashToken) {
                    params.append("h", hashToken);
                }

                const response = await fetch(`/api/folders/${folderId}/files?${params}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch files: ${response.statusText}`);
                }

                const data = await response.json();

                const normalizeFileDates = (f: ContextFile): ContextFile => ({
                    ...f,
                    // Ensure fields used in sorting are Date objects
                    createdAt: new Date(f.createdAt as unknown as string),
                    takenAt: f.takenAt ? new Date(f.takenAt as unknown as string) : null,
                });

                const normalizedFiles: ContextFile[] = (data.files as ContextFile[]).map(normalizeFileDates);

                if (append) {
                    setFiles(prevFiles => {
                        // Check for duplicates to avoid adding same files multiple times
                        const existingIds = new Set(prevFiles.map(f => f.id));
                        const newFiles = normalizedFiles.filter((f: ContextFile) => !existingIds.has(f.id));
                        return [...prevFiles, ...newFiles];
                    });
                } else {
                    setFiles(normalizedFiles);
                }

                setPagination(data.pagination);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                loadingRef.current = false;
                setLoading(false);
            }
        },
        [folderId, sortMethod, limit, shareToken, hashToken]
    );

    const loadMore = useCallback(async () => {
        if (pagination.hasNextPage && !loadingRef.current) {
            await fetchFiles(pagination.page + 1, true);
        }
    }, [fetchFiles, pagination.hasNextPage, pagination.page]);

    const refreshFiles = useCallback(async () => {
        setFiles([]);
        setPagination(prev => ({ ...prev, page: 0 }));
        await fetchFiles(1, false);
    }, [fetchFiles]);

    // Reset and refetch when sort method changes
    useEffect(() => {
        refreshFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sortMethod]);

    // Initialize: if no initial files, fetch first page; if initial files exist, allow loading next page
    useEffect(() => {
        if (initialFiles.length === 0) {
            fetchFiles(1, false);
        } else {
            // If we have initial files, set up pagination for them
            setPagination(prev => ({
                ...prev,
                page: 1,
                // Unknown if there are more; allow next page and let server correct
                hasNextPage: true,
                totalFiles: initialFiles.length,
            }));
        }
    }, [fetchFiles, initialFiles.length]);

    return {
        files,
        loading,
        error,
        hasNextPage: pagination.hasNextPage,
        loadMore,
        refreshFiles,
        setFiles,
    };
}
