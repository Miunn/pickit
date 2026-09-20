import { NextRequest } from "next/server";
import { parseMediaVariant, serveFolderFile } from "@/lib/serve-folder-file";

export const runtime = "nodejs";

export async function GET(
	req: NextRequest,
	props: { params: Promise<{ folder: string; file: string; variant: string }> }
) {
	const params = await props.params;
	return serveFolderFile(req, params.folder, params.file, {
		variant: parseMediaVariant(params.variant),
	});
}
