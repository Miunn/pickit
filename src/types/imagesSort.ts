/* =========================
 * Public sort value type
 * ========================= */

export type FilesSortDefinition = Name | Size | Date | Taken | typeof Position;

/* =========================
 * Attribute & direction enums
 * ========================= */

export enum SortAttribute {
	Name = "Name",
	Size = "Size",
	Date = "Date",
	Taken = "Taken",
	Position = "Position",
}

export enum SortDirection {
	Asc = "Asc",
	Desc = "Desc",
}

enum Name {
	Asc = "Name.Asc",
	Desc = "Name.Desc",
}

enum Size {
	Asc = "Size.Asc",
	Desc = "Size.Desc",
}
enum Date {
	Asc = "Date.Asc",
	Desc = "Date.Desc",
}

enum Taken {
	Asc = "Taken.Asc",
	Desc = "Taken.Desc",
}

const Position = "Position";

export const FilesSort = {
	Name: Name,
	Size: Size,
	Date: Date,
	Taken: Taken,
	Position: Position,
} as const;

/* =========================
 * Attribute categories
 * ========================= */

export type DirectionalAttribute = SortAttribute.Name | SortAttribute.Size | SortAttribute.Date | SortAttribute.Taken;

export type NonDirectionalAttribute = SortAttribute.Position;

/* =========================
 * Parsing helper
 * ========================= */

export function parseFilesSort(sort: FilesSortDefinition): {
	attribute: SortAttribute;
	direction: SortDirection | null;
} {
	const parts = sort.split(".");

	if (parts.length === 1) {
		return {
			attribute: SortAttribute.Position,
			direction: null,
		};
	}

	const [attr, dir] = parts as [keyof typeof SortAttribute, keyof typeof SortDirection];

	return {
		attribute: SortAttribute[attr],
		direction: SortDirection[dir],
	};
}

/* =========================
 * Type-level helpers
 * ========================= */

/**
 * Coerce/validate an incoming sort string into a FilesSortDefinition.
 *
 * - If `sort` is falsy, returns the default `FilesSort.Position`.
 * - If `sort` exactly matches one of the known FilesSort values, returns it.
 * - If `sort` is a case-insensitive form like "name.asc" or "date.desc", attempts to normalize
 *   to the canonical casing (e.g. "Name.Asc") and returns that if valid.
 * - Otherwise falls back to `FilesSort.Position`.
 */
export function toFilesSortDefinition(sort?: string | null): FilesSortDefinition {
	const allowed = new Set<string>([
		FilesSort.Name.Asc,
		FilesSort.Name.Desc,
		FilesSort.Size.Asc,
		FilesSort.Size.Desc,
		FilesSort.Date.Asc,
		FilesSort.Date.Desc,
		FilesSort.Taken.Asc,
		FilesSort.Taken.Desc,
		FilesSort.Position,
	]);

	if (!sort) return FilesSort.Position;

	if (allowed.has(sort)) {
		return sort as FilesSortDefinition;
	}

	// Try to normalize common lower/upper-case variants like "name.asc" -> "Name.Asc"
	const parts = sort.split(".");
	if (parts.length === 2) {
		const [attr, dir] = parts;
		const attrCased = attr.charAt(0).toUpperCase() + attr.slice(1).toLowerCase();
		const dirCased = dir.charAt(0).toUpperCase() + dir.slice(1).toLowerCase();
		const candidate = `${attrCased}.${dirCased}`;
		if (allowed.has(candidate)) {
			return candidate as FilesSortDefinition;
		}
	}

	// Fallback to default
	return FilesSort.Position;
}

export type ExtractAttribute<T extends FilesSortDefinition> = T extends `${infer A}.${string}`
	? A
	: T extends `${infer A}`
		? A
		: never;

export type ExtractDirection<T extends FilesSortDefinition> = T extends `${string}.${infer D}` ? D : null;
