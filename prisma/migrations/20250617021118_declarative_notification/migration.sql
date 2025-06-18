/*
  Warnings:

  - You are about to drop the column `data` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `authorName` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `folderName` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `href` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "data",
DROP COLUMN "message",
ADD COLUMN     "authorName" TEXT NOT NULL,
ADD COLUMN     "folderName" TEXT NOT NULL,
ADD COLUMN     "href" TEXT NOT NULL;
