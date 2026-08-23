-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "OrganizationInvitation" ADD COLUMN     "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING';
