-- CreateTable
CREATE TABLE "public"."SharedReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userBookId" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "showDates" BOOLEAN NOT NULL DEFAULT true,
    "showBookClubs" BOOLEAN NOT NULL DEFAULT true,
    "showReadathons" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedReview_userBookId_key" ON "public"."SharedReview"("userBookId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedReview_shareToken_key" ON "public"."SharedReview"("shareToken");

-- CreateIndex
CREATE INDEX "SharedReview_shareToken_idx" ON "public"."SharedReview"("shareToken");

-- CreateIndex
CREATE INDEX "SharedReview_userId_idx" ON "public"."SharedReview"("userId");

-- AddForeignKey
ALTER TABLE "public"."SharedReview" ADD CONSTRAINT "SharedReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SharedReview" ADD CONSTRAINT "SharedReview_userBookId_fkey" FOREIGN KEY ("userBookId") REFERENCES "public"."UserBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
