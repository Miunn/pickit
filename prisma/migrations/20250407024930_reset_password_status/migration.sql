-- CreateEnum
CREATE TYPE "PasswordResetRequestStatus" AS ENUM ('PENDING', 'SUCCESS', 'ERROR');

-- AlterTable
ALTER TABLE "PasswordResetRequest" ADD COLUMN     "status" "PasswordResetRequestStatus" NOT NULL DEFAULT 'PENDING';
