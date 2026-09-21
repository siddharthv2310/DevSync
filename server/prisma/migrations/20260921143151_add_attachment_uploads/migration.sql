-- CreateEnum
CREATE TYPE "AttachmentUploadStatus" AS ENUM ('PENDING', 'COMPLETED', 'CONSUMED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "AttachmentUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "AttachmentUploadStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttachmentUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttachmentUpload_userId_idx" ON "AttachmentUpload"("userId");

-- CreateIndex
CREATE INDEX "AttachmentUpload_conversationId_idx" ON "AttachmentUpload"("conversationId");

-- CreateIndex
CREATE INDEX "AttachmentUpload_status_idx" ON "AttachmentUpload"("status");

-- CreateIndex
CREATE INDEX "AttachmentUpload_expiresAt_idx" ON "AttachmentUpload"("expiresAt");

-- AddForeignKey
ALTER TABLE "AttachmentUpload" ADD CONSTRAINT "AttachmentUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttachmentUpload" ADD CONSTRAINT "AttachmentUpload_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
