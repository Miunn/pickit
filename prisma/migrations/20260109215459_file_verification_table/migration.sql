-- CreateTable
CREATE TABLE "FileVerificationMetadata" (
    "id" TEXT NOT NULL,
    "objectPath" TEXT NOT NULL,
    "expectedMime" TEXT NOT NULL,
    "expectedSize" INTEGER NOT NULL,
    "expectedSha256" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileVerificationMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileVerificationMetadata_fileId_key" ON "FileVerificationMetadata"("fileId");

-- AddForeignKey
ALTER TABLE "FileVerificationMetadata" ADD CONSTRAINT "FileVerificationMetadata_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
