/*
  Warnings:

  - You are about to drop the column `UpdatedAt` on the `TeamInvitation` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `TeamInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TeamInvitation" DROP COLUMN "UpdatedAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
