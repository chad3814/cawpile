-- CreateTable
CREATE TABLE "public"."HardcoverBook" (
    "id" TEXT NOT NULL,
    "hardcoverId" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "authors" TEXT[],
    "description" TEXT,
    "releaseDate" TEXT,
    "pages" INTEGER,
    "imageUrl" TEXT,
    "categories" TEXT[],
    "isbn" TEXT,
    "isbn13" TEXT,
    "hardcoverSlug" TEXT,
    "openLibraryId" TEXT,
    "goodReadsId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HardcoverBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IbdbBook" (
    "id" TEXT NOT NULL,
    "ibdbId" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IbdbBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HardcoverBook_hardcoverId_key" ON "public"."HardcoverBook"("hardcoverId");

-- CreateIndex
CREATE UNIQUE INDEX "HardcoverBook_editionId_key" ON "public"."HardcoverBook"("editionId");

-- CreateIndex
CREATE UNIQUE INDEX "IbdbBook_ibdbId_key" ON "public"."IbdbBook"("ibdbId");

-- CreateIndex
CREATE UNIQUE INDEX "IbdbBook_editionId_key" ON "public"."IbdbBook"("editionId");

-- AddForeignKey
ALTER TABLE "public"."HardcoverBook" ADD CONSTRAINT "HardcoverBook_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "public"."Edition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IbdbBook" ADD CONSTRAINT "IbdbBook_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "public"."Edition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
