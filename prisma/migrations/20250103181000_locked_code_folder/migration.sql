-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "lockCode" INTEGER,
ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false;
