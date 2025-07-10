-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'EFFICIENT', 'PRO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE';
