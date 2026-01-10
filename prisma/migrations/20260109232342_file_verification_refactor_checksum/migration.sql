/*
  Warnings:

  - You are about to drop the column `expectedSha256` on the `FileVerificationMetadata` table. All the data in the column will be lost.
  - Added the required column `expectedCrc32` to the `FileVerificationMetadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FileVerificationMetadata" DROP COLUMN "expectedSha256",
ADD COLUMN     "expectedCrc32" TEXT NOT NULL;
