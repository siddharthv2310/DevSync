/*
  Warnings:

  - The values [LOCAL] on the enum `AuthProvider` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `providerId` on table `OAuthAccount` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuthProvider_new" AS ENUM ('EMAIL', 'GOOGLE', 'GITHUB');
ALTER TABLE "OAuthAccount" ALTER COLUMN "provider" TYPE "AuthProvider_new" USING ("provider"::text::"AuthProvider_new");
ALTER TYPE "AuthProvider" RENAME TO "AuthProvider_old";
ALTER TYPE "AuthProvider_new" RENAME TO "AuthProvider";
DROP TYPE "public"."AuthProvider_old";
COMMIT;

-- AlterTable
ALTER TABLE "OAuthAccount" ALTER COLUMN "providerId" SET NOT NULL;
