-- AlterTable
ALTER TABLE "ConversationMember" ADD COLUMN     "isMuted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mutedUntil" TIMESTAMP(3);
