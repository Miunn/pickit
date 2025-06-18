/*
  Warnings:

  - You are about to drop the column `folderId` on the `Vault` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vaultId]` on the table `Folder` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Vault" DROP CONSTRAINT "Vault_folderId_fkey";

-- DropIndex
DROP INDEX "Vault_folderId_key";

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "vaultId" TEXT;

-- AlterTable
ALTER TABLE "Vault" DROP COLUMN "folderId";

-- CreateIndex
CREATE UNIQUE INDEX "Folder_vaultId_key" ON "Folder"("vaultId");

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_vaultId_fkey" FOREIGN KEY ("vaultId") REFERENCES "Vault"("id") ON DELETE SET NULL ON UPDATE CASCADE;
