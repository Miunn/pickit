/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `VerifyEmailRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VerifyEmailRequest_token_key" ON "VerifyEmailRequest"("token");
