import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

/** Midpoint of the 1–10 CAWPILE scale; used as the mean when no ratings exist. */
export const NEUTRAL_MEAN = 5.5;

const GLOBAL_ID = 'global';

/**
 * Recompute a single book's denormalized stats from source, inside a transaction.
 * Drift-proof: per-book counters are derived from truth on every call. The global
 * ratings totals are adjusted by an atomic delta so concurrent writes cannot lose
 * updates. The Bayesian rating uses the transaction-authoritative global row.
 */
export async function recomputeBookStats(
  bookId: string,
  tx: Prisma.TransactionClient
): Promise<void> {
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

  // Previously-contributed values, so we can apply an exact global delta.
  const prev = await tx.book.findUnique({
    where: { id: bookId },
    select: { ratingCount: true, ratingSum: true },
  });
  const oldCount = prev?.ratingCount ?? 0;
  const oldSum = prev?.ratingSum ?? 0;

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
  const bayesianRating =
    (global.weightC * mean + ratingSum) / (global.weightC + ratingCount);

  await tx.book.update({
    where: { id: bookId },
    data: { readerCount, ratingCount, ratingSum, bayesianRating },
  });

  invalidateGlobalBookStatsCache();
}

// --- Read-side cache for m/C (NOT used by the write path) ---

export interface GlobalBookStatsView {
  weightC: number;
  ratingsCount: number;
  ratingsTotal: number;
  mean: number;
}

const CACHE_TTL_MS = 60_000;
let cache: { value: GlobalBookStatsView; expires: number } | null = null;

export function invalidateGlobalBookStatsCache(): void {
  cache = null;
}

/** Cached accessor for the global mean/weight, for read-side consumers. */
export async function getGlobalBookStats(now = Date.now()): Promise<GlobalBookStatsView> {
  if (cache && cache.expires > now) return cache.value;

  const row = await prisma.globalBookStats.upsert({
    where: { id: GLOBAL_ID },
    create: { id: GLOBAL_ID },
    update: {},
  });
  const mean = row.ratingsCount > 0 ? row.ratingsTotal / row.ratingsCount : NEUTRAL_MEAN;
  const value: GlobalBookStatsView = {
    weightC: row.weightC,
    ratingsCount: row.ratingsCount,
    ratingsTotal: row.ratingsTotal,
    mean,
  };
  cache = { value, expires: now + CACHE_TTL_MS };
  return value;
}
