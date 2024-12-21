-- CreateEnum
CREATE TYPE "FolderTokenPermission" AS ENUM ('READ', 'WRITE');

-- AlterTable
ALTER TABLE "AccessToken" ADD COLUMN     "permission" "FolderTokenPermission" NOT NULL DEFAULT 'READ';
