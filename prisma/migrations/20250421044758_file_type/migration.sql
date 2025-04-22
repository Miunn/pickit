/*
  Warnings:

  - The `type` column on the `File` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "File" DROP COLUMN "type",
ADD COLUMN     "type" "FileType" NOT NULL DEFAULT 'IMAGE';
