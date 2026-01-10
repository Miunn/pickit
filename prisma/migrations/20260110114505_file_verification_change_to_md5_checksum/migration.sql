/*
  Warnings:

  - You are about to drop the column `expectedCrc32` on the `FileVerificationMetadata` table. All the data in the column will be lost.
  - Added the required column `expectedMd5` to the `FileVerificationMetadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FileVerificationMetadata" DROP COLUMN "expectedCrc32",
ADD COLUMN     "expectedMd5" TEXT NOT NULL;
