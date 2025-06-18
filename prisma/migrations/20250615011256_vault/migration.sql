-- AlterTable
ALTER TABLE "User" ADD COLUMN     "privateKey" TEXT,
ADD COLUMN     "publicKey" TEXT;

-- CreateTable
CREATE TABLE "Vault" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vault_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vault_folderId_key" ON "Vault"("folderId");

-- AddForeignKey
ALTER TABLE "Vault" ADD CONSTRAINT "Vault_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
