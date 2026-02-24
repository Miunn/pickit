import { FolderTagService } from "@/data/folder-tag-service";
import { AuthService } from "@/data/secure/auth";
import { NextResponse } from "next/server";

export async function GET() {
	const { isAuthenticated, session } = await AuthService.isAuthenticated();

	if (!isAuthenticated) {
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
