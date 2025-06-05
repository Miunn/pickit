-- CreateTable
CREATE TABLE "FolderTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FolderTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FileToFolderTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FileToFolderTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FileToFolderTag_B_index" ON "_FileToFolderTag"("B");

-- AddForeignKey
ALTER TABLE "FolderTag" ADD CONSTRAINT "FolderTag_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToFolderTag" ADD CONSTRAINT "_FileToFolderTag_A_fkey" FOREIGN KEY ("A") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToFolderTag" ADD CONSTRAINT "_FileToFolderTag_B_fkey" FOREIGN KEY ("B") REFERENCES "FolderTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
