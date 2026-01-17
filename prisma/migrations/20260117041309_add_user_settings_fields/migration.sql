-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "profilePictureUrl" TEXT,
ADD COLUMN     "showCurrentlyReading" BOOLEAN NOT NULL DEFAULT false;
