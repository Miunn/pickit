/*
  Warnings:

  - You are about to drop the `PersonAccessToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PersonAccessToken" DROP CONSTRAINT "PersonAccessToken_folderId_fkey";

-- AlterTable
ALTER TABLE "AccessToken" ADD COLUMN     "email" TEXT NOT NULL DEFAULT '';

-- DropTable
DROP TABLE "PersonAccessToken";
