-- AlterTable
ALTER TABLE "public"."UserBook" ADD COLUMN     "acquisitionMethod" TEXT,
ADD COLUMN     "acquisitionOther" VARCHAR(100),
ADD COLUMN     "authorPoc" TEXT,
ADD COLUMN     "authorPocDetails" VARCHAR(200),
ADD COLUMN     "bookClubName" VARCHAR(100),
ADD COLUMN     "disabilityDetails" VARCHAR(500),
ADD COLUMN     "disabilityRepresentation" TEXT,
ADD COLUMN     "dnfReason" VARCHAR(500),
ADD COLUMN     "isNewAuthor" BOOLEAN,
ADD COLUMN     "isReread" BOOLEAN DEFAULT false,
ADD COLUMN     "lgbtqDetails" VARCHAR(500),
ADD COLUMN     "lgbtqRepresentation" TEXT,
ADD COLUMN     "readathonName" VARCHAR(100);

-- CreateTable
CREATE TABLE "public"."UserBookClub" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBookClub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserReadathon" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReadathon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserBookClub_userId_lastUsed_idx" ON "public"."UserBookClub"("userId", "lastUsed");

-- CreateIndex
CREATE UNIQUE INDEX "UserBookClub_userId_name_key" ON "public"."UserBookClub"("userId", "name");

-- CreateIndex
CREATE INDEX "UserReadathon_userId_lastUsed_idx" ON "public"."UserReadathon"("userId", "lastUsed");

-- CreateIndex
CREATE UNIQUE INDEX "UserReadathon_userId_name_key" ON "public"."UserReadathon"("userId", "name");

-- AddForeignKey
ALTER TABLE "public"."UserBookClub" ADD CONSTRAINT "UserBookClub_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserReadathon" ADD CONSTRAINT "UserReadathon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
