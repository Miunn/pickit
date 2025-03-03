-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "name" TEXT,
ALTER COLUMN "createdById" DROP NOT NULL;
