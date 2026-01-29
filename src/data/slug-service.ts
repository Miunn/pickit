import slugify from "slugify";
import crypto from "node:crypto";

export class SlugService {
	static generateSlug(text: string, unique: boolean = false): string {
		if (unique) {
			const uniqueSuffix = crypto.randomBytes(3).toString("hex");
			return `${slugify(text, { lower: true, strict: true })}-${uniqueSuffix}`;
		}

		return slugify(text, { lower: true, strict: true });
	}
}
