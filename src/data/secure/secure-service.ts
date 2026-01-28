import { enforceFolder } from "@/data/secure/folder";
import { enforceFile } from "@/data/secure/file";
import { enforceNotification } from "./notification";

export const SecureService = {
	folder: { enforce: enforceFolder },
	file: { enforce: enforceFile },
	notification: { enforce: enforceNotification },
};
