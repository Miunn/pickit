/**
 * Migrate db to update taken_at column with new value read from exif data
 */

import { GoogleBucket } from "@/lib/bucket";
import { prisma } from "@/lib/prisma";
import exifr from "exifr";
import sharp from "sharp";

async function collectFiles() {
    const files = await prisma.file.findMany({
        where: {
            takenAt: null
        }
    });

    console.log(`Found ${files.length} files with takenAt null`);

    return files;
}

async function getFileFromBucket(fileId: string) {
    const file = await GoogleBucket.file(fileId).download();
    return file;
}

async function getExifData(file: Uint8Array) {
    const metadata = await sharp(file).metadata();
    const exif = await exifr.parse(file, true);
    return { metadata, exif };
}

async function main() {
    const files = await collectFiles();
    let updatedCount = 0;
    for (const file of files) {
        const filePath = `${file.createdById}/${file.folderId}/${file.id}`;
        const [googleFile] = await getFileFromBucket(filePath);
        const fileBuffer = Buffer.from(googleFile);
        try {
        const { exif } = await getExifData(fileBuffer);

        const takenAt = exif.DateTimeOriginal || exif.DateTimeDigitized || exif.DateTime;
        if (takenAt) {
            await prisma.file.update({
                where: { id: file.id },
                data: { takenAt: new Date(takenAt) }
            });
            updatedCount++;
        }
    } catch (error) {
        console.error(`Error getting exif data for file ${file.id}: ${error}`);
    }

        if (updatedCount % 100 === 0) {
            console.log(`Updated ${updatedCount} files...`);
        }
    }
    console.log(`Updated ${updatedCount} files`);
}

main();