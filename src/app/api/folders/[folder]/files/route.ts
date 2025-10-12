import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAllowedToAccessFolder } from "@/lib/dal";
import { FolderService } from "@/data/folder-service";
import { generateV4DownloadUrl } from "@/lib/bucket";
import { ImagesSortMethod } from "@/types/imagesSort";

const querySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    sort: z.nativeEnum(ImagesSortMethod).optional().default(ImagesSortMethod.DateDesc),
    share: z.string().nullish(),
    h: z.string().nullish(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ folder: string }> }) {
    try {
        const { folder: folderId } = await params;
        const { searchParams } = new URL(request.url);

        const validation = querySchema.safeParse({
            page: searchParams.get("page"),
            limit: searchParams.get("limit"),
            sort: searchParams.get("sort"),
            share: searchParams.get("share"),
            h: searchParams.get("h"),
        });

        if (!validation.success) {
            return NextResponse.json(
                { error: "Invalid query parameters", details: validation.error.issues },
                { status: 400 }
            );
        }

        const { page, limit, sort, share, h } = validation.data;

        // Check folder access
        const hasAccess = await isAllowedToAccessFolder(folderId, share, h);

        if (hasAccess === 0 || hasAccess === 2 || hasAccess === 3) {
            return NextResponse.json({ error: "Unauthorized access to folder" }, { status: 403 });
        }

        // Get folder with files count for total calculation
        const folderWithCount = await FolderService.get({
            where: { id: folderId },
            include: {
                _count: {
                    select: { files: true },
                },
            },
        });

        if (!folderWithCount) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        // Calculate pagination
        const offset = (page - 1) * limit;
        const totalFiles = folderWithCount._count.files;
        const totalPages = Math.ceil(totalFiles / limit);
        const hasNextPage = page < totalPages;

        // Get paginated files
        const folder = await FolderService.get({
            where: { id: folderId },
            include: {
                files: {
                    include: {
                        folder: {
                            include: {
                                _count: { select: { files: true } },
                                tags: true,
                            },
                        },
                        comments: { include: { createdBy: true } },
                        likes: true,
                        tags: true,
                    },
                    skip: offset,
                    take: limit,
                    orderBy: getSortOrderBy(sort),
                },
            },
        });

        if (!folder) {
            return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        }

        // Files are already sorted by the database orderBy, no need to sort again
        // Generate signed URLs for the files
        const filesWithSignedUrls = await Promise.all(
            folder.files.map(async file => ({
                ...file,
                signedUrl: await generateV4DownloadUrl(`${file.createdById}/${file.folderId}/${file.id}`),
            }))
        );

        return NextResponse.json({
            files: filesWithSignedUrls,
            pagination: {
                page,
                limit,
                totalFiles,
                totalPages,
                hasNextPage,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error("Error fetching paginated files:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

function getSortOrderBy(sort: ImagesSortMethod) {
    switch (sort) {
        case ImagesSortMethod.NameAsc:
            return { name: "asc" as const };
        case ImagesSortMethod.NameDesc:
            return { name: "desc" as const };
        case ImagesSortMethod.SizeAsc:
            return { size: "asc" as const };
        case ImagesSortMethod.SizeDesc:
            return { size: "desc" as const };
        case ImagesSortMethod.DateAsc:
            return { createdAt: "asc" as const };
        case ImagesSortMethod.DateDesc:
            return { createdAt: "desc" as const };
        case ImagesSortMethod.TakenAsc:
            return { takenAt: "asc" as const };
        case ImagesSortMethod.TakenDesc:
            return { takenAt: "desc" as const };
        case ImagesSortMethod.PositionAsc:
            return { position: "asc" as const };
        case ImagesSortMethod.PositionDesc:
            return { position: "desc" as const };
        default:
            return { createdAt: "desc" as const };
    }
}
