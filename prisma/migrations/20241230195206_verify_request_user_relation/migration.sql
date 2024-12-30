-- CreateTable
CREATE TABLE "VerifyEmailRequest" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "VerifyEmailRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerifyEmailRequest_userId_key" ON "VerifyEmailRequest"("userId");

-- AddForeignKey
ALTER TABLE "VerifyEmailRequest" ADD CONSTRAINT "VerifyEmailRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
