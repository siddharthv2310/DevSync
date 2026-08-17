-- CreateTable
CREATE TABLE "registerOtp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiredAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "registerOtp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registerOtp_userId_idx" ON "registerOtp"("userId");

-- AddForeignKey
ALTER TABLE "registerOtp" ADD CONSTRAINT "registerOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
