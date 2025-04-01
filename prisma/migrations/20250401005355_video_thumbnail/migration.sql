-- AlterTable
ALTER TABLE "Image" ALTER COLUMN "type" SET DEFAULT 'image';

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "thumbnail" TEXT,
ALTER COLUMN "width" SET DEFAULT 0,
ALTER COLUMN "height" SET DEFAULT 0;
