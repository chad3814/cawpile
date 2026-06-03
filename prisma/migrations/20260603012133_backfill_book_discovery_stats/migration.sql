-- Data migration: backfill the denormalized discovery stats from existing rows.
-- The preceding schema migration adds these columns at DEFAULT 0; without this
-- backfill the discovery page would show an empty "Top Rated" and a randomly
-- ordered "Most Popular" until the recompute-book-stats script is run.
-- Mirrors src/lib/db/bookStats.ts and is safe to re-run (recomputed from source).

-- Per-book reader and completed-rating counts.
UPDATE "Book" b SET
  "readerCount" = COALESCE((
    SELECT COUNT(DISTINCT ub."userId")
    FROM "UserBook" ub
    JOIN "Edition" e ON e."id" = ub."editionId"
    WHERE e."bookId" = b."id"
  ), 0),
  "ratingCount" = COALESCE((
    SELECT COUNT(*)
    FROM "CawpileRating" cr
    JOIN "UserBook" ub ON ub."id" = cr."userBookId"
    JOIN "Edition" e ON e."id" = ub."editionId"
    WHERE e."bookId" = b."id" AND ub."status" = 'COMPLETED'
  ), 0),
  "ratingSum" = COALESCE((
    SELECT SUM(cr."average")
    FROM "CawpileRating" cr
    JOIN "UserBook" ub ON ub."id" = cr."userBookId"
    JOIN "Edition" e ON e."id" = ub."editionId"
    WHERE e."bookId" = b."id" AND ub."status" = 'COMPLETED'
  ), 0);

-- Global completed-rating totals (singleton row seeded by the schema migration).
UPDATE "GlobalBookStats" SET
  "ratingsCount" = COALESCE((
    SELECT COUNT(*)
    FROM "CawpileRating" cr
    JOIN "UserBook" ub ON ub."id" = cr."userBookId"
    WHERE ub."status" = 'COMPLETED'
  ), 0),
  "ratingsTotal" = COALESCE((
    SELECT SUM(cr."average")
    FROM "CawpileRating" cr
    JOIN "UserBook" ub ON ub."id" = cr."userBookId"
    WHERE ub."status" = 'COMPLETED'
  ), 0)
WHERE "id" = 'global';

-- Bayesian rating from the now-populated global mean (NEUTRAL_MEAN = 5.5 when the
-- library has no completed ratings yet), matching recomputeBookStats.
UPDATE "Book" b SET "bayesianRating" =
  (g."weightC" * (CASE WHEN g."ratingsCount" > 0 THEN g."ratingsTotal" / g."ratingsCount" ELSE 5.5 END) + b."ratingSum")
  / (g."weightC" + b."ratingCount")
FROM "GlobalBookStats" g
WHERE g."id" = 'global';
