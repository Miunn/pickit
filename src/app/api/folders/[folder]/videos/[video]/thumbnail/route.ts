import { NextRequest } from "next/server";
import { serveFolderFile } from "@/lib/serve-folder-file";

export async function GET(
	req: NextRequest,
	props: { params: Promise<{ folder: string; video: string }> }
) {
	const params = await props.params;
	return serveFolderFile(req, params.folder, params.video, { variant: "preview" });
}
