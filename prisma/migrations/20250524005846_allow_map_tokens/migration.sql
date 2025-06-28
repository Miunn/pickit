-- AlterTable
ALTER TABLE "AccessToken" ADD COLUMN     "allowMap" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PersonAccessToken" ADD COLUMN     "allowMap" BOOLEAN NOT NULL DEFAULT false;
