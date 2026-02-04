/*
  Warnings:

  - The `role` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `PasswordResetRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerifyEmailRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PasswordResetRequest" DROP CONSTRAINT "PasswordResetRequest_userId_fkey";

-- DropForeignKey
ALTER TABLE "VerifyEmailRequest" DROP CONSTRAINT "VerifyEmailRequest_userId_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "role",
ADD COLUMN     "role" TEXT;

-- DropTable
DROP TABLE "PasswordResetRequest";

-- DropTable
DROP TABLE "VerifyEmailRequest";

-- DropEnum
DROP TYPE "PasswordResetRequestStatus";

-- DropEnum
DROP TYPE "Role";
