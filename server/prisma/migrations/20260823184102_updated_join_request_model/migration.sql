/*
  Warnings:

  - Made the column `updatedAt` on table `OrganizationJoinRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "OrganizationJoinRequest" ALTER COLUMN "reviewedById" DROP NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;
