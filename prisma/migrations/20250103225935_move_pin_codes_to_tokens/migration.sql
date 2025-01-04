/*
  Warnings:

  - You are about to drop the column `lockCode` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the column `locked` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AccessToken" ADD COLUMN     "pinCode" TEXT;

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "lockCode",
DROP COLUMN "locked";

-- AlterTable
ALTER TABLE "PersonAccessToken" ADD COLUMN     "pinCode" TEXT;
