/*
  Warnings:

  - A unique constraint covering the columns `[tokenHash]` on the table `OrganizationInvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_tokenHash_key" ON "OrganizationInvitation"("tokenHash");
