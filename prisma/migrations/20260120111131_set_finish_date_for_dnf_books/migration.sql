-- Set finishDate for all existing DNF books that don't have one
-- Uses updatedAt as the best available approximation of when the book was DNF'd
-- This migration is idempotent: only affects records where finishDate IS NULL
UPDATE "public"."UserBook"
SET "finishDate" = "updatedAt"
WHERE status = 'DNF' AND "finishDate" IS NULL;
