-- CreateTable
CREATE TABLE "PersonAccessToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "permission" "FolderTokenPermission" NOT NULL DEFAULT 'READ',
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PersonAccessToken_token_key" ON "PersonAccessToken"("token");

-- AddForeignKey
ALTER TABLE "PersonAccessToken" ADD CONSTRAINT "PersonAccessToken_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
