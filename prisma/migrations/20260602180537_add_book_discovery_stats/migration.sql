-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "bayesianRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ratingSum" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "readerCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "GlobalBookStats" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "weightC" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "ratingsCount" INTEGER NOT NULL DEFAULT 0,
    "ratingsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalBookStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Book_createdAt_idx" ON "Book"("createdAt");

-- CreateIndex
CREATE INDEX "Book_readerCount_idx" ON "Book"("readerCount");

-- CreateIndex
CREATE INDEX "Book_bayesianRating_idx" ON "Book"("bayesianRating");

-- Seed the singleton global stats row
INSERT INTO "GlobalBookStats" ("id", "updatedAt") VALUES ('global', NOW()) ON CONFLICT ("id") DO NOTHING;
