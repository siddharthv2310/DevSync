/*
  Warnings:

  - You are about to drop the column `createdById` on the `Conversation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[messageId,userId]` on the table `MessageReaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_createdById_fkey";

-- DropIndex
DROP INDEX "MessageReaction_messageId_userId_emoji_key";

-- DropIndex
DROP INDEX "MessageReaction_userId_idx";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "createdById";

-- AlterTable
ALTER TABLE "ConversationMember" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_key" ON "MessageReaction"("messageId", "userId");
