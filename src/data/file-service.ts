import { GoogleBucket } from "@/lib/bucket";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import exifr from "exifr";
import mediaInfoFactory, { Track } from "mediainfo.js";
import { randomUUID } from "node:crypto";
import fs, { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";

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

async function upload() {}

// Define types for better overload handling
type GetOptions<
	S extends Prisma.FileSelect | undefined = undefined,
	I extends Prisma.FileInclude | undefined = undefined,
> = {
	method?: "unique";
	where: Prisma.FileWhereUniqueInput;
} & (S extends Prisma.FileSelect ? { select: S } : object) &
	(I extends Prisma.FileInclude ? { include: I } : object);

type GetFirstOptions<
	S extends Prisma.FileSelect | undefined = undefined,
	I extends Prisma.FileInclude | undefined = undefined,
> = {
	where: Prisma.FileWhereInput;
	method?: "first";
	orderBy?: Prisma.Enumerable<Prisma.FileOrderByWithRelationInput>;
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
function get<S extends Prisma.FileSelect | undefined = undefined, I extends Prisma.FileInclude | undefined = undefined>(
	options: GetOptions<S, I> | GetFirstOptions<S, I>
): Promise<GetResult<S, I> | null> {
	if (options.method === "first") {
		return prisma.file.findFirst({
			where: options.where,
			select: "select" in options ? options.select : undefined,
			include: "include" in options ? options.include : undefined,
			orderBy: "orderBy" in options ? options.orderBy : undefined,
		}) as Promise<GetResult<S, I> | null>;
	}

	return prisma.file.findUnique({
		where: options.where as Prisma.FileWhereUniqueInput,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
	}) as Promise<GetResult<S, I> | null>;
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
function getMultiple<
	S extends Prisma.FileSelect | undefined = undefined,
	I extends Prisma.FileInclude | undefined = undefined,
>(options: GetMultipleOptions<S, I>): Promise<GetMultipleResult<S, I>> {
	return prisma.file.findMany({
		where: options.where,
		select: "select" in options ? options.select : undefined,
		include: "include" in options ? options.include : undefined,
		orderBy: options.orderBy,
		take: options.take,
	}) as Promise<GetMultipleResult<S, I>>;
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
	return await prisma.file.update({
		where: { id: fileId },
		data,
		include,
	});
}

async function del(fileId: string) {
	await prisma.file.delete({
		where: { id: fileId },
	});
}

async function extractAndSaveImageMetadata(folderId: string, fileId: string, objectPath?: string) {
	let filePath = objectPath;
	if (!filePath) {
		const pathData = await FileService.get({
			where: { id: fileId },
			select: { folder: { select: { id: true, createdById: true } } },
		});
		filePath = `${pathData?.folder.createdById}/${pathData?.folder.id}/${fileId}`;
	}

	const [rawFile] = await GoogleBucket.file(filePath).download();
	const uploadedBuffer = Buffer.from(rawFile);

	const metadata = await sharp(uploadedBuffer).metadata();
	const exif = await exifr.parse(uploadedBuffer, true);
	return FileService.update(
		fileId,
		{
			position: (await getLastPosition(folderId)) + 1000,
			width: metadata.width || 0,
			height: metadata.height || 0,
			make: exif.Make,
			model: exif.Model,
			software: exif.Software,
			orientation: exif.Orientation?.toString(),
			exposureTime: exif.ExposureTime,
			fNumber: exif.FNumber,
			iso: exif.ISO,
			focalLength: exif.FocalLength,
			flash: exif.Flash,
			takenAt: exif.TakenAt,
			modifiedAt: exif.ModifiedAt,
			contrast: exif.Contrast,
			saturation: exif.Saturation,
			sharpness: exif.Sharpness,
			whiteBalance: exif.WhiteBalance,
			altitude: exif.GPSAltitude,
			latitude: exif.latitude,
			longitude: exif.longitude,
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

	const [rawFile] = await GoogleBucket.file(filePath).download();
	const uploadedBuffer = Buffer.from(rawFile);

	// Process thumbnail creation
	try {
		const thumbnailBuffer = await extractThumbnailFromBuffer(uploadedBuffer);

		// Save thumbnail
		await GoogleBucket.file(thumbnailFilePath).save(thumbnailBuffer);
	} catch (err) {
		console.error("Error creating thumbnail:", err);
	}

	// Create video record
	const mediainfo = await mediaInfoFactory({
		locateFile: file => `${process.env.NEXT_PUBLIC_APP_URL}/mediainfo/${file}`,
	});
	const metadata = await mediainfo.analyzeData(uploadedBuffer.length, () => uploadedBuffer);
	mediainfo.close();
	return FileService.update(
		fileId,
		{
			position: (await getLastPosition(folderId)) + 1000,
			thumbnail: `${fileId}-thumbnail`,
			width:
				metadata.media?.track.find((track: Track) => track["@type"] === "Video")
					?.Active_Width || 0,
			height:
				metadata.media?.track.find((track: Track) => track["@type"] === "Video")
					?.Active_Height || 0,
			duration:
				metadata.media?.track.find((track: Track) => track["@type"] === "General")?.Duration ||
				0,
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

async function extractThumbnailFromBuffer(videoBuffer: Buffer): Promise<Buffer> {
	const tempDir = mkdtempSync(path.join(tmpdir(), "thumb-"));
	const inputPath = path.join(tempDir, `input-${randomUUID()}.video`);
	const outputPath = path.join(tempDir, `thumbnail-${randomUUID()}.jpg`);

	console.log("Temp dir", tempDir);
	console.log("inputPath", inputPath);
	console.log("outputPath", outputPath);

	try {
		// Write video buffer to a temp file
		fs.writeFileSync(inputPath, videoBuffer);

		// Run FFmpeg to extract a single frame at timestamp
		await new Promise((resolve, reject) => {
			ffmpeg(inputPath)
				.seekInput("00:00:00")
				.outputOptions(["-vframes 1"])
				.output(outputPath)
				.on("end", resolve)
				.on("error", reject)
				.run();
		});

		// Read and return thumbnail buffer
		const thumbBuffer = fs.readFileSync(outputPath);
		return thumbBuffer;
	} finally {
		// Clean up temp files and directory
		try {
			if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
			if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
			fs.rmdirSync(tempDir);
		} catch (error_) {
			console.warn("Temporary file cleanup failed:", error_);
		}
	}
}

export const FileService = {
	create,
	upload,
	get,
	getMultiple,
	update,
	delete: del,
	extractAndSaveImageMetadata,
	extractAndSaveVideoMetadata,
};
