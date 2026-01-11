/*
  Warnings:

  - You are about to drop the column `createdById` on the `FileVerificationMetadata` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fileId]` on the table `FileVerificationMetadata` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileId` to the `FileVerificationMetadata` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FileVerificationMetadata" DROP CONSTRAINT "FileVerificationMetadata_createdById_fkey";

-- AlterTable
ALTER TABLE "FileVerificationMetadata" DROP COLUMN "createdById",
ADD COLUMN     "fileId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "FileVerificationMetadata_fileId_key" ON "FileVerificationMetadata"("fileId");

-- AddForeignKey
ALTER TABLE "FileVerificationMetadata" ADD CONSTRAINT "FileVerificationMetadata_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
