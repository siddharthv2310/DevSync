/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,slug]` on the table `Team` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Team_organizationId_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "Team_organizationId_slug_key" ON "Team"("organizationId", "slug");
