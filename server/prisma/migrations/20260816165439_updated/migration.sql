/*
  Warnings:

  - You are about to drop the `registerOtp` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "registerOtp" DROP CONSTRAINT "registerOtp_userId_fkey";

-- DropTable
DROP TABLE "registerOtp";

-- CreateTable
CREATE TABLE "RegisterOtp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RegisterOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RegisterOtp_userId_idx" ON "RegisterOtp"("userId");

-- AddForeignKey
ALTER TABLE "RegisterOtp" ADD CONSTRAINT "RegisterOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
