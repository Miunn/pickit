/*
  Warnings:

  - You are about to drop the column `emailVerificationDeadline` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "emailVerificationDeadline",
ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false;
