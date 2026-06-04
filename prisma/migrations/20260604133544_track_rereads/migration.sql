-- AlterTable
ALTER TABLE "UserBook" ADD COLUMN     "readNumber" INTEGER NOT NULL DEFAULT 1;

-- DropIndex
DROP INDEX "UserBook_userId_editionId_key";

-- CreateIndex
CREATE UNIQUE INDEX "UserBook_userId_editionId_readNumber_key" ON "UserBook"("userId", "editionId", "readNumber");
