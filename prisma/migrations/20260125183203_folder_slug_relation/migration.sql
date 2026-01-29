/*
  Warnings:

  - You are about to drop the column `slug` on the `Folder` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Folder_slug_key";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "slug";

-- CreateTable
CREATE TABLE "FolderSlug" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolderSlug_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FolderSlug_slug_key" ON "FolderSlug"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FolderSlug_folderId_key" ON "FolderSlug"("folderId");

-- AddForeignKey
ALTER TABLE "FolderSlug" ADD CONSTRAINT "FolderSlug_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
