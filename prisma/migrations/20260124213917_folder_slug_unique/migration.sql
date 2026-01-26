/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.
  - Made the column `slug` on table `Folder` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Folder" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Folder_slug_key" ON "Folder"("slug");
