-- CreateEnum
CREATE TYPE "public"."BookStatus" AS ENUM ('WANT_TO_READ', 'READING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."BookFormat" AS ENUM ('HARDCOVER', 'PAPERBACK', 'EBOOK', 'AUDIOBOOK');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Book" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT[],
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Edition" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "isbn10" TEXT,
    "isbn13" TEXT,
    "title" TEXT,
    "authors" TEXT[],
    "format" "public"."BookFormat",
    "googleBooksId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Edition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoogleBook" (
    "id" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "authors" TEXT[],
    "description" TEXT,
    "publishedDate" TEXT,
    "pageCount" INTEGER,
    "imageUrl" TEXT,
    "categories" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "editionId" TEXT NOT NULL,
    "status" "public"."BookStatus" NOT NULL,
    "format" "public"."BookFormat" NOT NULL,
    "startDate" TIMESTAMP(3),
    "finishDate" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Book_title_idx" ON "public"."Book"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Book_title_authors_key" ON "public"."Book"("title", "authors");

-- CreateIndex
CREATE UNIQUE INDEX "Edition_googleBooksId_key" ON "public"."Edition"("googleBooksId");

-- CreateIndex
CREATE INDEX "Edition_bookId_idx" ON "public"."Edition"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Edition_isbn10_key" ON "public"."Edition"("isbn10");

-- CreateIndex
CREATE UNIQUE INDEX "Edition_isbn13_key" ON "public"."Edition"("isbn13");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleBook_googleId_key" ON "public"."GoogleBook"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleBook_editionId_key" ON "public"."GoogleBook"("editionId");

-- CreateIndex
CREATE INDEX "UserBook_userId_status_idx" ON "public"."UserBook"("userId", "status");

-- CreateIndex
CREATE INDEX "UserBook_userId_createdAt_idx" ON "public"."UserBook"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserBook_userId_editionId_key" ON "public"."UserBook"("userId", "editionId");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Edition" ADD CONSTRAINT "Edition_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoogleBook" ADD CONSTRAINT "GoogleBook_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "public"."Edition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBook" ADD CONSTRAINT "UserBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBook" ADD CONSTRAINT "UserBook_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "public"."Edition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
