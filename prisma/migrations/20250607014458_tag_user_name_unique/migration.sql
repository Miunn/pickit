/*
  Warnings:

  - A unique constraint covering the columns `[name,userId]` on the table `FolderTag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FolderTag_name_userId_key" ON "FolderTag"("name", "userId");
