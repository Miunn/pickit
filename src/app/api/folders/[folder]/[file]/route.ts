import { NextRequest } from "next/server";
import { serveFolderFile } from "@/lib/serve-folder-file";

export async function GET(
	req: NextRequest,
	props: { params: Promise<{ file: string; folder: string }> }
) {
	const params = await props.params;
	return serveFolderFile(req, params.folder, params.file);
}
