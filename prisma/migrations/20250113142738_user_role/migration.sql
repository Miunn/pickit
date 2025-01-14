-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" TEXT[] DEFAULT ARRAY['USER']::TEXT[];
