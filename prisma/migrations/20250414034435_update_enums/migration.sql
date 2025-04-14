/*
  Warnings:

  - The values [SUCCESS,ERROR] on the enum `PasswordResetRequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "FolderTokenPermission" ADD VALUE 'ADMIN';

-- AlterEnum
BEGIN;
CREATE TYPE "PasswordResetRequestStatus_new" AS ENUM ('PENDING', 'USED', 'EXPIRED');
ALTER TABLE "PasswordResetRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PasswordResetRequest" ALTER COLUMN "status" TYPE "PasswordResetRequestStatus_new" USING ("status"::text::"PasswordResetRequestStatus_new");
ALTER TYPE "PasswordResetRequestStatus" RENAME TO "PasswordResetRequestStatus_old";
ALTER TYPE "PasswordResetRequestStatus_new" RENAME TO "PasswordResetRequestStatus";
DROP TYPE "PasswordResetRequestStatus_old";
ALTER TABLE "PasswordResetRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
