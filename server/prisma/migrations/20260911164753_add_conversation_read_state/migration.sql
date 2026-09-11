/*
  Warnings:

  - You are about to drop the column `lastReadAt` on the `ConversationMember` table. All the data in the column will be lost.
  - You are about to drop the column `lastReadMessageId` on the `ConversationMember` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ConversationMember" DROP COLUMN "lastReadAt",
DROP COLUMN "lastReadMessageId";

-- CreateTable
CREATE TABLE "ConversationReadState" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastReadMessageId" TEXT,
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationReadState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationReadState_userId_idx" ON "ConversationReadState"("userId");

-- CreateIndex
CREATE INDEX "ConversationReadState_conversationId_idx" ON "ConversationReadState"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationReadState_conversationId_userId_key" ON "ConversationReadState"("conversationId", "userId");

-- AddForeignKey
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationReadState" ADD CONSTRAINT "ConversationReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
