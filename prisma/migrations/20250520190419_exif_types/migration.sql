/*
  Warnings:

  - The `altitude` column on the `File` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `contrast` column on the `File` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `exposureTime` column on the `File` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `fNumber` column on the `File` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `focalLength` column on the `File` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "altitude",
ADD COLUMN     "altitude" DOUBLE PRECISION,
DROP COLUMN "contrast",
ADD COLUMN     "contrast" DOUBLE PRECISION,
DROP COLUMN "exposureTime",
ADD COLUMN     "exposureTime" DOUBLE PRECISION,
DROP COLUMN "fNumber",
ADD COLUMN     "fNumber" DOUBLE PRECISION,
DROP COLUMN "focalLength",
ADD COLUMN     "focalLength" DOUBLE PRECISION,
ALTER COLUMN "iso" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "latitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "longitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "orientation" SET DATA TYPE TEXT;
