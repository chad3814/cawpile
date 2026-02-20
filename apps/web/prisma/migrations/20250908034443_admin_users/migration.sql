/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."BookType" AS ENUM ('FICTION', 'NONFICTION');

-- AlterEnum
ALTER TYPE "public"."BookStatus" ADD VALUE 'DNF';

-- AlterTable
ALTER TABLE "public"."Book" ADD COLUMN     "bookType" "public"."BookType" NOT NULL DEFAULT 'FICTION';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "readingGoal" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "public"."UserBook" ADD COLUMN     "currentPage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "review" TEXT;

-- CreateTable
CREATE TABLE "public"."CawpileRating" (
    "id" TEXT NOT NULL,
    "userBookId" TEXT NOT NULL,
    "characters" INTEGER,
    "atmosphere" INTEGER,
    "writing" INTEGER,
    "plot" INTEGER,
    "intrigue" INTEGER,
    "logic" INTEGER,
    "enjoyment" INTEGER,
    "average" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CawpileRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReadingSession" (
    "id" TEXT NOT NULL,
    "userBookId" TEXT NOT NULL,
    "startPage" INTEGER NOT NULL,
    "endPage" INTEGER NOT NULL,
    "pagesRead" INTEGER NOT NULL,
    "duration" INTEGER,
    "notes" TEXT,
    "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReadingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "actionType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CawpileRating_userBookId_key" ON "public"."CawpileRating"("userBookId");

-- CreateIndex
CREATE INDEX "CawpileRating_userBookId_idx" ON "public"."CawpileRating"("userBookId");

-- CreateIndex
CREATE INDEX "CawpileRating_average_idx" ON "public"."CawpileRating"("average");

-- CreateIndex
CREATE INDEX "ReadingSession_userBookId_idx" ON "public"."ReadingSession"("userBookId");

-- CreateIndex
CREATE INDEX "ReadingSession_sessionDate_idx" ON "public"."ReadingSession"("sessionDate");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "public"."AdminAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "public"."AdminAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_timestamp_idx" ON "public"."AdminAuditLog"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- AddForeignKey
ALTER TABLE "public"."CawpileRating" ADD CONSTRAINT "CawpileRating_userBookId_fkey" FOREIGN KEY ("userBookId") REFERENCES "public"."UserBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReadingSession" ADD CONSTRAINT "ReadingSession_userBookId_fkey" FOREIGN KEY ("userBookId") REFERENCES "public"."UserBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
