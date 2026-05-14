-- CreateTable
CREATE TABLE "AmazonBook" (
    "id" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT[],
    "description" TEXT,
    "publishedDate" TEXT,
    "pageCount" INTEGER,
    "imageUrl" TEXT,
    "categories" TEXT[],
    "isbn10" TEXT,
    "isbn13" TEXT,
    "publisher" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmazonBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmazonAsinCache" (
    "asin" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmazonAsinCache_pkey" PRIMARY KEY ("asin")
);

-- CreateIndex
CREATE UNIQUE INDEX "AmazonBook_asin_key" ON "AmazonBook"("asin");

-- CreateIndex
CREATE UNIQUE INDEX "AmazonBook_editionId_key" ON "AmazonBook"("editionId");

-- AddForeignKey
ALTER TABLE "AmazonBook" ADD CONSTRAINT "AmazonBook_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
