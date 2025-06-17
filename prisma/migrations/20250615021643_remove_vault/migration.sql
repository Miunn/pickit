/*
  Warnings:

  - You are about to drop the column `vaultId` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the `Vault` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_vaultId_fkey";

-- DropIndex
DROP INDEX "Folder_vaultId_key";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "vaultId";

-- DropTable
DROP TABLE "Vault";
