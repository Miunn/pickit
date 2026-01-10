/*
  Warnings:

  - You are about to drop the column `fileId` on the `FileVerificationMetadata` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "FileVerificationMetadata" DROP CONSTRAINT "FileVerificationMetadata_fileId_fkey";

-- DropIndex
DROP INDEX "FileVerificationMetadata_fileId_key";

-- AlterTable
ALTER TABLE "FileVerificationMetadata" DROP COLUMN "fileId";
