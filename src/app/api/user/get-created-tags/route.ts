import { FolderTagService } from "@/data/folder-tag-service";
import { getCurrentSession } from "@/data/session";
import { NextResponse } from "next/server";

export async function GET() {
	const session = await getCurrentSession();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const tags = await FolderTagService.getMultiple({
		where: { userId: session.user.id },
		select: {
			id: true,
			name: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	return NextResponse.json(tags);
}
