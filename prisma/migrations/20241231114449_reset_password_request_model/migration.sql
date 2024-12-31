-- CreateTable
CREATE TABLE "PasswordResetRequest" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetRequest_token_key" ON "PasswordResetRequest"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetRequest_userId_key" ON "PasswordResetRequest"("userId");

-- AddForeignKey
ALTER TABLE "PasswordResetRequest" ADD CONSTRAINT "PasswordResetRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
