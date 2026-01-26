import slugify from "slugify";

export class SlugService {
	static generateSlug(text: string, unique: boolean = false): string {
		if (unique) {
			const uniqueSuffix = Math.random().toString(36).substring(2, 5);
			return `${slugify(text, { lower: true, strict: true })}-${uniqueSuffix}`;
		}

		return slugify(text, { lower: true, strict: true });
	}
}
