import { prisma } from "@/lib/prisma";
import exifr from "exifr";
import { Storage } from "@google-cloud/storage";

const googleCloudStorage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_KEY_FILE
})

const GoogleBucket = googleCloudStorage.bucket(process.env.GCP_BUCKET_NAME as string);

export const up = async (): Promise<void> => {
  try {
    const files = await prisma.file.findMany({
      where: {
        type: "IMAGE",
      },
    });
    for (const file of files) {
        const googleBucket = GoogleBucket.file(`${file.createdById}/${file.folderId}/${file.id}`);
        const [fileBuffer] = await googleBucket.download();
        const exif = await exifr.parse(fileBuffer, true);
        await prisma.file.update({
            where: {
                id: file.id
                },
                data: {
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
                    longitude: exif.longitude
                }
            });
        console.log("Updated file", file.id);
    }
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

export const down = async (): Promise<void> => {
  try {
    
    console.log('Rollback completed successfully');
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
};

// Metadata about the migration
export const meta = {
  version: 1,
  description: 'Description of what this migration does',
  timestamp: new Date().toISOString(),
};

// Main execution function
const runMigration = async () => {  
  try {
    // Get command line arguments
    const command = process.argv[2];
    
    if (command === 'up') {
      await up();
    } else if (command === 'down') {
      await down();
    } else {
      console.error('Please specify "up" or "down" as command line argument');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    console.log('Disconnected from database');
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  runMigration().catch(console.error);
}
