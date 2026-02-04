/*
  Warnings:

  - You are about to drop the column `sessionToken` on the `session` table. All the data in the column will be lost.
  - The required column `id` was added to the `session` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "session_sessionToken_key";

-- AlterTable
ALTER TABLE "session" DROP COLUMN "sessionToken",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "session_pkey" PRIMARY KEY ("id");
