-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'video';

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'video';
