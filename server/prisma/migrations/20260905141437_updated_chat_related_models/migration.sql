/*
  Warnings:

  - A unique constraint covering the columns `[organizationId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Conversation_organizationId_key" ON "Conversation"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_teamId_key" ON "Conversation"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_projectId_key" ON "Conversation"("projectId");
