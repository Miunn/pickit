/*
  Warnings:

  - Changed the type of `expectedCrc32` on the `FileVerificationMetadata` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "FileVerificationMetadata" DROP COLUMN "expectedCrc32",
ADD COLUMN     "expectedCrc32" INTEGER NOT NULL;
