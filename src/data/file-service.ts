import { GoogleBucket } from "@/lib/bucket";
import { embedGpsInJpegBuffer, isJpegImage, type ImageGps } from "@/lib/embed-image-gps";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import exifr from "exifr";
import mediaInfoFactory, { Track } from "mediainfo.js";
import { randomUUID } from "node:crypto";
import fs, { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import ffmpeg from "fluent-ffmpeg";
import "@/lib/ffmpeg";

const IMAGE_THUMBNAIL_MAX = 400;
const IMAGE_MEDIUM_MAX = 1600;
const DERIVATIVE_CACHE_CONTROL = "public, max-age=31536000, immutable";

function createImageDerivative(buffer: Buffer, maxSize: number, quality: number) {
	return sharp(buffer, { failOn: "none" })
		.rotate()
		.resize(maxSize, maxSize, {
			fit: "inside",
			withoutEnlargement: true,
		})
		.webp({ quality })
		.toBuffer();
}

async function createImageDerivatives(buffer: Buffer) {
	const thumbnail = await createImageDerivative(buffer, IMAGE_THUMBNAIL_MAX, 75);
	const medium = await createImageDerivative(buffer, IMAGE_MEDIUM_MAX, 80);
	return { thumbnail, medium };
}

async function saveDerivative(objectPath: string, buffer: Buffer, contentType: string) {
	await GoogleBucket.file(objectPath).save(buffer, {
		contentType,
		metadata: { cacheControl: DERIVATIVE_CACHE_CONTROL },
	});
}

// Function overloads for create
async function create(data: Prisma.FileCreateInput): Promise<Prisma.FileGetPayload<object>>;
async function create<I extends Prisma.FileInclude>(
	data: Prisma.FileCreateInput,
	include: I
): Promise<Prisma.FileGetPayload<{ include: I }>>;
async function create(
	data: Prisma.FileCreateInput,
	include?: Prisma.FileInclude
): Promise<Prisma.FileGetPayload<{ include?: Prisma.FileInclude }>> {
	const file = await prisma.file.create({
		data,
		include,
	});

	return file;
}

// Define types for better overload handling
type GetOptions<
	S extends Prisma.FileSelect | undefined = undefined,
	I extends Prisma.FileInclude | undefined = undefined,
> = {
	method?: "unique";
	where: Prisma.FileWhereUniqueInput;
	include?: I;
} & (S extends Prisma.FileSelect ? { select: S } : object) &
	(I extends Prisma.FileInclude ? { include: I } : object);

type GetFirstOptions<
	S extends Prisma.FileSelect | undefined = undefined,
	I extends Prisma.FileInclude | undefined = undefined,
> = {
	where: Prisma.FileWhereInput;
	method?: "first";
	orderBy?: Prisma.Enumerable<Prisma.FileOrderByWithRelationInput>;
	include?: I;
} & (S extends Prisma.FileSelect ? { select: S } : object) &
	(I extends Prisma.FileInclude ? { include: I } : object);

type GetResult<
	S extends Prisma.FileSelect | undefined,
	I extends Prisma.FileInclude | undefined,
> = S extends Prisma.FileSelect
	? Prisma.FileGetPayload<{ select: S }>
	: I extends Prisma.FileInclude
		? Prisma.FileGetPayload<{ include: I }>
		: Prisma.FileGetPayload<object>;

// Overloaded function using generic constraints
async function get<
	S extends Prisma.FileSelect | undefined = undefined,
	I extends Prisma.FileInclude | undefined = undefined,
>(options: GetOptions<S, I> | GetFirstOptions<S, I>): Promise<GetResult<S, I> | null> {
	const file =
		options.method === "first"
			? await prisma.file.findFirst({
					where: options.where,
					select: "select" in options ? options.select : undefined,
					include: "include" in options ? options.include : undefined,
					orderBy: "orderBy" in options ? options.orderBy : undefined,
				})
			: await prisma.file.findUnique({
					where: options.where as Prisma.FileWhereUniqueInput,
					select: "select" in options ? options.select : undefined,
					include: "include" in options ? options.include : undefined,
				});

	if (!file) {
		return null;
	}

	return file as unknown as GetResult<S, I>;
}

// Define types for getMultiple
type GetMultipleOptions<
	S extends Prisma.FileSelect | undefined = undefined,
	I extends Prisma.FileInclude | undefined = undefined,
> = {
	where?: Prisma.FileWhereInput;
	orderBy?: Prisma.Enumerable<Prisma.FileOrderByWithRelationInput>;
	take?: number;
} & (S extends Prisma.FileSelect ? { select: S } : object) &
	(I extends Prisma.FileInclude ? { include: I } : object);

type GetMultipleResult<
	S extends Prisma.FileSelect | undefined,
	I extends Prisma.FileInclude | undefined,
> = S extends Prisma.FileSelect
	? Prisma.FileGetPayload<{ select: S }>[]
	: I extends Prisma.FileInclude
		? Prisma.FileGetPayload<{ include: I }>[]
		: Prisma.FileGetPayload<object>[];

// Overloaded function using generic constraints
async function getMultiple<
	S extends Prisma.FileSelect | undefined = undefined,
	I extends Prisma.FileInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
	const files = await prisma.file.findMany({
		where: options.where,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
		orderBy: options.orderBy,
		take: options.take,
	});

	return files as unknown as GetMultipleResult<S, I>;
}

// Function overloads for update
async function update(fileId: string, data: Prisma.FileUpdateInput): Promise<Prisma.FileGetPayload<object>>;
async function update<I extends Prisma.FileInclude>(
	fileId: string,
	data: Prisma.FileUpdateInput,
	include: I
): Promise<Prisma.FileGetPayload<{ include: I }>>;
async function update(
	fileId: string,
	data: Prisma.FileUpdateInput,
	include?: Prisma.FileInclude
): Promise<Prisma.FileGetPayload<{ include?: Prisma.FileInclude }>> {
	const file = await prisma.file.update({
		where: { id: fileId },
		data,
		include,
	});

	return file;
}

async function del(fileId: string) {
	await prisma.file.delete({
		where: { id: fileId },
	});
}

async function extractAndSaveImageMetadata(
	folderId: string,
	fileId: string,
	objectPath?: string,
	clientGps?: ImageGps
) {
	const fileRecord = await FileService.get({
		where: { id: fileId },
		select: {
			extension: true,
			folder: { select: { id: true, createdById: true } },
		},
	});

	let filePath = objectPath;
	if (!filePath) {
		filePath = `${fileRecord?.folder.createdById}/${fileRecord?.folder.id}/${fileId}`;
	}

	console.log("[image metadata] starting extraction", { folderId, fileId, filePath });

	const [rawFile] = await GoogleBucket.file(filePath).download();
	const uploadedBuffer = Buffer.from(rawFile);
	console.log("[image metadata] downloaded image", { fileId, size: uploadedBuffer.length });

	const thumbnailName = `${fileId}-thumbnail`;
	const mediumName = `${fileId}-medium`;
	let savedThumbnail: string | undefined;
	let savedMedium: string | undefined;

	try {
		const derivatives = await createImageDerivatives(uploadedBuffer);
		await Promise.all([
			saveDerivative(`${filePath}-thumbnail`, derivatives.thumbnail, "image/webp"),
			saveDerivative(`${filePath}-medium`, derivatives.medium, "image/webp"),
		]);
		savedThumbnail = thumbnailName;
		savedMedium = mediumName;
		console.log("[image metadata] derivatives created", {
			fileId,
			thumbnail: savedThumbnail,
			medium: savedMedium,
		});
	} catch (err) {
		console.error("[image metadata] error creating derivatives", { fileId, err });
	}

	let metadata: Partial<Metadata> = {};
	const [metadataResult, exif, gps] = await Promise.all([
		sharp(uploadedBuffer, { failOn: "none" })
			.metadata()
			.catch(error => {
				console.error("[image metadata] sharp metadata failed", { fileId, error });
				return undefined;
			}),
		exifr.parse(uploadedBuffer, { gps: true }).catch(error => {
			console.error("[image metadata] exifr parse failed", { fileId, error });
			return undefined;
		}),
		exifr.gps(uploadedBuffer).catch(() => undefined),
	]);
	if (metadataResult) {
		metadata = metadataResult;
	}
	const takenAt = exif?.DateTimeOriginal ?? exif?.TakenAt;
	const modifiedAt = exif?.ModifyDate ?? exif?.ModifiedAt;
	const latitude = gps?.latitude ?? exif?.latitude ?? clientGps?.latitude;
	const longitude = gps?.longitude ?? exif?.longitude ?? clientGps?.longitude;
	let altitude = exif?.GPSAltitude ?? clientGps?.altitude;
	if (typeof altitude === "number" && exif?.GPSAltitudeRef === 1) {
		altitude = -altitude;
	}
	console.log("[image metadata] extracted metadata", {
		fileId,
		format: metadata.format,
		width: metadata.width,
		height: metadata.height,
		orientation: metadata.orientation,
		hasExif: exif !== undefined && exif !== null,
		make: exif?.Make,
		model: exif?.Model,
		takenAt,
		latitude,
		longitude,
		altitude,
		hasGps: typeof latitude === "number" && typeof longitude === "number",
		clientGpsProvided: clientGps !== undefined && clientGps !== null,
	});

	const updatedFile = await FileService.update(
		fileId,
		{
			position: (await getLastPosition(folderId)) + 1000,
			...(savedThumbnail ? { thumbnail: savedThumbnail } : {}),
			...(savedMedium ? { medium: savedMedium } : {}),
			width: metadata.width || 0,
			height: metadata.height || 0,
			make: exif?.Make,
			model: exif?.Model,
			software: exif?.Software,
			orientation: exif?.Orientation?.toString(),
			exposureTime: exif?.ExposureTime,
			fNumber: exif?.FNumber,
			iso: exif?.ISO,
			focalLength: exif?.FocalLength,
			flash: exif?.Flash,
			takenAt,
			modifiedAt,
			contrast: exif?.Contrast,
			saturation: exif?.Saturation,
			sharpness: exif?.Sharpness,
			whiteBalance: exif?.WhiteBalance,
			altitude,
			latitude,
			longitude,
		},
		{
			tags: true,
			comments: { include: { createdBy: true } },
			likes: true,
			folder: {
				include: { tags: true, _count: { select: { files: true } } },
			},
		}
	);

	if (
		typeof latitude === "number" &&
		typeof longitude === "number" &&
		isJpegImage(metadata.format, fileRecord?.extension)
	) {
		try {
			const withGps = embedGpsInJpegBuffer(uploadedBuffer, {
				latitude,
				longitude,
				altitude,
			});
			await GoogleBucket.file(filePath).save(withGps, {
				contentType: "image/jpeg",
			});
			console.log("[image metadata] embedded GPS in stored original", {
				fileId,
				latitude,
				longitude,
				altitude,
			});
		} catch (err) {
			console.error("[image metadata] failed to embed GPS in stored original", { fileId, err });
		}
	}

	return updatedFile;
}

async function extractAndSaveVideoMetadata(folderId: string, fileId: string, objectPath?: string) {
	let filePath = objectPath;
	let thumbnailFilePath = objectPath ? `${objectPath}-thumbnail` : undefined;
	if (!filePath || !thumbnailFilePath) {
		const pathData = await FileService.get({
			where: { id: fileId },
			select: { folder: { select: { id: true, createdById: true } } },
		});
		filePath = `${pathData?.folder.createdById}/${pathData?.folder.id}/${fileId}`;
		thumbnailFilePath = `${pathData?.folder.createdById}/${pathData?.folder.id}/${fileId}-thumbnail`;
	}

	const gcsFile = GoogleBucket.file(filePath);
	let width = 0;
	let height = 0;
	let duration = 0;
	let thumbnail: string | undefined;

	try {
		const [objectMetadata] = await gcsFile.getMetadata();
		const fileSize = Number(objectMetadata.size || 0);
		const mediainfo = await mediaInfoFactory();
		try {
			const metadata = await mediainfo.analyzeData(fileSize, async (size, offset) => {
				const end = Math.min(offset + size, fileSize) - 1;
				if (end < offset) {
					return new Uint8Array();
				}
				const [chunk] = await gcsFile.download({ start: offset, end });
				return new Uint8Array(chunk);
			});
			const videoTrack = metadata.media?.track.find((track: Track) => track["@type"] === "Video");
			const generalTrack = metadata.media?.track.find(
				(track: Track) => track["@type"] === "General"
			);
			width = Math.round(Number(videoTrack?.Width || videoTrack?.Active_Width) || 0);
			height = Math.round(Number(videoTrack?.Height || videoTrack?.Active_Height) || 0);
			duration = Math.round(Number(generalTrack?.Duration) || 0);
		} finally {
			mediainfo.close();
		}
	} catch (err) {
		console.error("Error reading video metadata:", err);
	}

	try {
		const [readUrl] = await gcsFile.getSignedUrl({
			version: "v4",
			action: "read",
			expires: Date.now() + 10 * 60 * 1000,
		});
		const thumbnailBuffer = await extractThumbnailFromUrl(readUrl);
		await saveDerivative(thumbnailFilePath, thumbnailBuffer, "image/jpeg");
		thumbnail = `${fileId}-thumbnail`;
	} catch (err) {
		console.error("Error creating thumbnail:", err);
	}

	return FileService.update(
		fileId,
		{
			position: (await getLastPosition(folderId)) + 1000,
			...(thumbnail ? { thumbnail } : {}),
			width,
			height,
			duration,
		},
		{
			tags: true,
			comments: { include: { createdBy: true } },
			likes: true,
			folder: {
				include: { tags: true, _count: { select: { files: true } } },
			},
		}
	);
}

async function getLastPosition(folderId: string) {
	const file = await FileService.get({
		where: { folderId },
		orderBy: { position: "desc" },
		method: "first",
	});
	return file?.position || 0;
}

async function extractThumbnailFromUrl(inputUrl: string): Promise<Buffer> {
	const tempDir = mkdtempSync(path.join(tmpdir(), "thumb-"));
	const outputPath = path.join(tempDir, `thumbnail-${randomUUID()}.jpg`);

	try {
		await new Promise((resolve, reject) => {
			const command = ffmpeg(inputUrl)
				.inputOptions(["-ss", "0"])
				.outputOptions(["-frames:v", "1"])
				.output(outputPath);
			const timer = setTimeout(() => {
				command.kill("SIGKILL");
				reject(new Error("ffmpeg thumbnail timed out"));
			}, 20_000);
			command
				.on("end", () => {
					clearTimeout(timer);
					resolve(undefined);
				})
				.on("error", error => {
					clearTimeout(timer);
					reject(error);
				})
				.run();
		});

		return fs.readFileSync(outputPath);
	} finally {
		try {
			if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
			fs.rmdirSync(tempDir);
		} catch (error_) {
			console.warn("Temporary file cleanup failed:", error_);
		}
	}
}

export const FileService = {
	create,
	get,
	getMultiple,
	update,
	delete: del,
	extractAndSaveImageMetadata,
	extractAndSaveVideoMetadata,
};
