-- AlterTable
ALTER TABLE "User" ADD COLUMN     "selectedTemplateId" TEXT;

-- AlterTable
ALTER TABLE "VideoTemplate" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "VideoTemplate_isPublished_createdAt_idx" ON "VideoTemplate"("isPublished", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_selectedTemplateId_fkey" FOREIGN KEY ("selectedTemplateId") REFERENCES "VideoTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoTemplate" ADD CONSTRAINT "VideoTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
