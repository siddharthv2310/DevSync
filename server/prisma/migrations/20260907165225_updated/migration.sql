-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "threadRootId" TEXT;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadRootId_fkey" FOREIGN KEY ("threadRootId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
