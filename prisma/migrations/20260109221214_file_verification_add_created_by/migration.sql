/*
  Warnings:

  - Added the required column `createdById` to the `FileVerificationMetadata` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FileVerificationMetadata" ADD COLUMN     "createdById" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "FileVerificationMetadata" ADD CONSTRAINT "FileVerificationMetadata_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
