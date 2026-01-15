import { enforceFolder } from "@/data/secure/folder";
import { enforceFile } from "@/data/secure/file";

export const SecureService = {
	folder: { enforce: enforceFolder },
	file: { enforce: enforceFile },
};
