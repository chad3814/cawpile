-- AlterTable
ALTER TABLE "public"."Book" ADD COLUMN     "primaryGenre" TEXT;

-- AlterTable
ALTER TABLE "public"."GoogleBook" ADD COLUMN     "audiobookDuration" INTEGER,
ADD COLUMN     "publisher" TEXT;
