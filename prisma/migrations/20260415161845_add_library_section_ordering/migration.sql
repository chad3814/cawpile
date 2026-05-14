-- AlterTable
ALTER TABLE "UserBook" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sortOrder" INTEGER;

-- CreateIndex
CREATE INDEX "UserBook_userId_status_isPinned_sortOrder_idx" ON "UserBook"("userId", "status", "isPinned", "sortOrder");
