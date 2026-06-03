import type { Prisma } from '@prisma/client';

/** Midpoint of the 1–10 CAWPILE scale; used as the mean when no ratings exist. */
export const NEUTRAL_MEAN = 5.5;

const GLOBAL_ID = 'global';

/**
 * Recompute a single book's denormalized stats from source, inside a transaction.
 *
 * The book row is locked with SELECT ... FOR UPDATE before its prior contribution
 * is read, so concurrent recomputes of the same book serialize: the second waits,
 * then reads the first's committed totals and applies an exact delta to the global
 * row. Per-book counters are always derived from source, so they cannot drift.
 */
export async function recomputeBookStats(
  bookId: string,
  tx: Prisma.TransactionClient
): Promise<void> {
  // Lock the book row first. A concurrent recompute of the same book blocks here
  // until this transaction commits, so the global delta below is always exact.
  const prev = await tx.$queryRaw<Array<{ ratingCount: number; ratingSum: number }>>`
    SELECT "ratingCount", "ratingSum" FROM "Book" WHERE "id" = ${bookId} FOR UPDATE
  `;
  const oldCount = prev[0]?.ratingCount ?? 0;
  const oldSum = prev[0]?.ratingSum ?? 0;

  // Distinct users tracking this book across all its editions, any status.
  const distinctUsers = await tx.userBook.findMany({
    where: { edition: { bookId } },
    select: { userId: true },
    distinct: ['userId'],
  });
  const readerCount = distinctUsers.length;

  // COMPLETED + rated aggregate for this book.
  const agg = await tx.cawpileRating.aggregate({
    where: { userBook: { status: 'COMPLETED', edition: { bookId } } },
    _count: { _all: true },
    _sum: { average: true },
  });
  const ratingCount = agg._count._all;
  const ratingSum = agg._sum.average ?? 0;

  const global = await tx.globalBookStats.upsert({
    where: { id: GLOBAL_ID },
    create: { id: GLOBAL_ID, ratingsCount: ratingCount, ratingsTotal: ratingSum },
    update: {
      ratingsCount: { increment: ratingCount - oldCount },
      ratingsTotal: { increment: ratingSum - oldSum },
    },
  });

  const mean =
    global.ratingsCount > 0 ? global.ratingsTotal / global.ratingsCount : NEUTRAL_MEAN;
  // bayesianRating is precomputed from the current global mean and weightC. Changing
  // GlobalBookStats.weightC therefore requires re-running the recompute-book-stats
  // backfill to refresh every book's stored rating.
  const bayesianRating =
    (global.weightC * mean + ratingSum) / (global.weightC + ratingCount);

  await tx.book.update({
    where: { id: bookId },
    data: { readerCount, ratingCount, ratingSum, bayesianRating },
  });
}
