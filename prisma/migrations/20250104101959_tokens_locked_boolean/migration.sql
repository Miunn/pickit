-- AlterTable
ALTER TABLE "AccessToken" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PersonAccessToken" ADD COLUMN     "locked" BOOLEAN NOT NULL DEFAULT false;
