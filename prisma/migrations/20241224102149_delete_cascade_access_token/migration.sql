-- DropForeignKey
ALTER TABLE "AccessToken" DROP CONSTRAINT "AccessToken_folderId_fkey";

-- AddForeignKey
ALTER TABLE "AccessToken" ADD CONSTRAINT "AccessToken_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
