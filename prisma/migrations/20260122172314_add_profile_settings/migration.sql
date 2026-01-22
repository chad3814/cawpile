-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showTbr" BOOLEAN NOT NULL DEFAULT false;

-- Set profileEnabled = true for all existing users (backwards compatibility)
-- This ensures existing users' profiles remain accessible after the migration
-- New users will get profileEnabled = false (opt-in behavior)
UPDATE "User" SET "profileEnabled" = true;
