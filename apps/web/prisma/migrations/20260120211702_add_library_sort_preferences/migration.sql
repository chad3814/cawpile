-- CreateEnum
CREATE TYPE "LibrarySortBy" AS ENUM ('END_DATE', 'START_DATE', 'TITLE', 'DATE_ADDED');

-- CreateEnum
CREATE TYPE "LibrarySortOrder" AS ENUM ('ASC', 'DESC');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "librarySortBy" "LibrarySortBy" NOT NULL DEFAULT 'END_DATE',
ADD COLUMN     "librarySortOrder" "LibrarySortOrder" NOT NULL DEFAULT 'DESC';
