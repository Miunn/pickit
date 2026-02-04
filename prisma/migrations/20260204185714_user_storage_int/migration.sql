/*
  Warnings:

  - You are about to alter the column `usedStorage` on the `user` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `maxStorage` on the `user` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "user" ALTER COLUMN "usedStorage" SET DATA TYPE INTEGER,
ALTER COLUMN "maxStorage" SET DATA TYPE INTEGER;
