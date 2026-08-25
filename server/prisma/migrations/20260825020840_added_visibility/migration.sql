-- CreateEnum
CREATE TYPE "OrganizationVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "visibility" "OrganizationVisibility" NOT NULL DEFAULT 'PRIVATE';
