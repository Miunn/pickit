import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Plan } from "@prisma/client";
import { FileWithFolder, FileWithTags } from "./definitions";
import { FilesSort, FilesSortDefinition } from "@/types/imagesSort";
import { File } from "@google-cloud/storage";

export const plansBenefits: Record<Plan, { storage: number; albums: number; sharingLinks: number }> = {
	[Plan.FREE]: {
		storage: 5000000000,
		albums: 10,
		sharingLinks: 50,
	},
	[Plan.EFFICIENT]: {
		storage: 10000000000,
		albums: 20,
		sharingLinks: 100,
	},
	[Plan.PRO]: {
		storage: 20000000000,
		albums: 50,
		sharingLinks: 200,
	},
};

export function formatBytes(
	bytes: number,
	opts: {
		decimals?: number;
		sizeType?: "accurate" | "normal";
	} = {}
) {
	const { decimals = 0, sizeType = "normal" } = opts;

	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const accurateSizes = ["B", "KiB", "MiB", "GiB", "TiB"];
	if (bytes === 0) return "0 B";
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${sizeType === "accurate" ? (accurateSizes[i] ?? "Bytest") : (sizes[i] ?? "B")}`;
}

export const convertDDtoDMS = (dd: number): { degrees: number; minutes: number; seconds: number } => {
	const abs = Math.abs(dd);
	const degrees = Math.floor(abs);
	const minutes = Math.floor((abs - degrees) * 60);
	const seconds = Math.floor((abs - degrees - minutes / 60) * 3600);

	return { degrees, minutes, seconds };
};

export const getDMSstringWithDirection = (
	degrees: number,
	minutes: number,
	seconds: number,
	direction: "N" | "S" | "E" | "W"
): string => {
	return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
};

export const getCoordinatesString = (latitude: number, longitude: number): string => {
	const latitudeDMS = convertDDtoDMS(latitude);
	const longitudeDMS = convertDDtoDMS(longitude);

	return `${getDMSstringWithDirection(latitudeDMS.degrees, latitudeDMS.minutes, latitudeDMS.seconds, latitude < 0 ? "S" : "N")}, ${getDMSstringWithDirection(longitudeDMS.degrees, longitudeDMS.minutes, longitudeDMS.seconds, longitude < 0 ? "W" : "E")}`;
};

export const switchLocaleUrl = (url: string, locale: string): string => {
	// Remove the locale from the url
	url = url.replace(/\/[a-z]{2}\/?/, "/");

	if (url.startsWith("/")) {
		return `/${locale}${url}`;
	}

	return `/${locale}/${url}`;
};

export const copyImageToClipboard = async (
	folderId: string,
	imageId: string,
	shareToken?: string,
	shareHashPin?: string,
	tokenType?: "accessToken" | "personAccessToken" | null
): Promise<boolean> => {
	let image = await (
		await fetch(
			`/api/folders/${folderId}/images/${imageId}?share=${shareToken}&h=${shareHashPin}&t=${tokenType === "personAccessToken" ? "p" : "a"}`
		)
	).blob();
	image = image.slice(0, image.size, "image/png");

	navigator.clipboard.write([
		new ClipboardItem({
			[image.type]: image,
		}),
	]);

	return true;
};

export function groupFiles<T extends FileWithTags>(files: T[]): { [key: string]: T[] } {
	const groups: { [key: string]: T[] } = {};

	files.forEach(file => {
		if (file.tags.length === 0) {
			if (!groups["no-tags"]) {
				groups["no-tags"] = [];
			}

			groups["no-tags"].push(file);
		}

		file.tags.forEach(tag => {
			if (!groups[tag.id]) {
				groups[tag.id] = [];
			}
			groups[tag.id].push(file);
		});
	});

	return groups;
}

export const getSortedContent = (arr: FileWithFolder[], sort: FilesSortDefinition) => {
	switch (sort) {
		case FilesSort.Name.Asc:
			return arr.sort(
				(a, b) => a.name.localeCompare(b.name) || a.createdAt.getTime() - b.createdAt.getTime()
			);
		case FilesSort.Name.Desc:
			return arr.sort(
				(a, b) => b.name.localeCompare(a.name) || a.createdAt.getTime() - b.createdAt.getTime()
			);
		case FilesSort.Size.Asc:
			return arr.sort((a, b) => a.size - b.size || a.name.localeCompare(b.name));
		case FilesSort.Size.Desc:
			return arr.sort((a, b) => b.size - a.size || a.name.localeCompare(b.name));
		case FilesSort.Date.Asc:
			return arr.sort(
				(a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.name.localeCompare(b.name)
			);
		case FilesSort.Date.Desc:
			return arr.sort(
				(a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.name.localeCompare(b.name)
			);
		case FilesSort.Taken.Asc:
			return arr.sort((a, b) => (a.takenAt?.getTime() || 0) - (b.takenAt?.getTime() || 0));
		case FilesSort.Taken.Desc:
			return arr.sort((a, b) => (b.takenAt?.getTime() || 0) - (a.takenAt?.getTime() || 0));
		case FilesSort.Position:
			return arr.sort((a, b) => a.position - b.position);
		default:
			return arr;
	}
};

export const getPlanFromString = (plan: string): Plan => {
	switch (plan.toLowerCase()) {
		case "free":
			return Plan.FREE;
		case "efficient":
			return Plan.EFFICIENT;
		case "pro":
			return Plan.PRO;
		default:
			return Plan.FREE;
	}
};

export const getPlanFromPriceId = (priceId: string) => {
	switch (priceId) {
		case process.env.NEXT_PUBLIC_PRICING_BASIC_YEARLY:
		case process.env.NEXT_PUBLIC_PRICING_BASIC_MONTHLY:
			return Plan.FREE;
		case process.env.NEXT_PUBLIC_PRICING_EFFICIENT_YEARLY:
		case process.env.NEXT_PUBLIC_PRICING_EFFICIENT_MONTHLY:
			return Plan.EFFICIENT;
		case process.env.NEXT_PUBLIC_PRICING_PRO_YEARLY:
		case process.env.NEXT_PUBLIC_PRICING_PRO_MONTHLY:
			return Plan.PRO;
		default:
			return null;
	}
};

export const getLimitsFromPlan = (plan: Plan): { storage: number; albums: number; sharingLinks: number } => {
	switch (plan) {
		case Plan.FREE:
			return {
				storage: plansBenefits.FREE.storage,
				albums: plansBenefits.FREE.albums,
				sharingLinks: plansBenefits.FREE.sharingLinks,
			};
		case Plan.EFFICIENT:
			return {
				storage: plansBenefits.EFFICIENT.storage,
				albums: plansBenefits.EFFICIENT.albums,
				sharingLinks: plansBenefits.EFFICIENT.sharingLinks,
			};
		case Plan.PRO:
			return {
				storage: plansBenefits.PRO.storage,
				albums: plansBenefits.PRO.albums,
				sharingLinks: plansBenefits.PRO.sharingLinks,
			};
		default:
			return {
				storage: 0,
				albums: 0,
				sharingLinks: 0,
			};
	}
};

/**
 * Determines whether a given date falls within the last three days.
 *
 * @param date - The date to check
 * @returns `true` if `date` is within the last three days (inclusive), `false` otherwise.
 */
export function isNewFile(date: Date) {
	const now = new Date();
	const diffTime = Math.abs(now.getTime() - date.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays <= 3;
}

export function webStreamFromFile(file: File): ReadableStream {
	const stream = file.createReadStream();

	// Convert Node.js Readable (from Google Cloud Storage) to a Web ReadableStream
	// suitable for the Fetch API / NextResponse
	return new globalThis.ReadableStream({
		start(controller) {
			stream.on("data", chunk => controller.enqueue(chunk));
			stream.on("end", () => controller.close());
			stream.on("error", err => controller.error(err));
		},
		cancel() {
			stream.destroy();
		},
	});
}

/**
 * Combine and normalize CSS class names into a single string, resolving Tailwind-specific conflicts.
 *
 * @param inputs - Class name values (strings, arrays, objects, etc.) to merge
 * @returns A single space-separated class string with duplicates removed and Tailwind utility conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function filterOut<T>(arr: T[], elmt: T) {
	return arr.filter(item => item !== elmt);
}

export function filterObjectOut<T>(arr: T[], property: keyof T, value: T[keyof T]) {
	return arr.filter(item => item[property] !== value);
}
