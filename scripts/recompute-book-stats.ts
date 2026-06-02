import prisma from '../src/lib/prisma';
import { NEUTRAL_MEAN } from '../src/lib/db/bookStats';

/**
 * Recompute every book's denormalized stats and the global stats row from source.
 * Re-runnable: this is the source-of-truth repair for any global-delta drift.
 */
async function main() {
  // 1. Global totals from all COMPLETED + rated books.
  const globalAgg = await prisma.cawpileRating.aggregate({
    where: { userBook: { status: 'COMPLETED' } },
    _count: { _all: true },
    _sum: { average: true },
  });
  const ratingsCount = globalAgg._count._all;
  const ratingsTotal = globalAgg._sum.average ?? 0;

  const global = await prisma.globalBookStats.upsert({
    where: { id: 'global' },
    create: { id: 'global', ratingsCount, ratingsTotal },
    update: { ratingsCount, ratingsTotal },
  });
  const mean = ratingsCount > 0 ? ratingsTotal / ratingsCount : NEUTRAL_MEAN;
  console.log(`Global: count=${ratingsCount} total=${ratingsTotal} mean=${mean} C=${global.weightC}`);

  // 2. Each book.
  const books = await prisma.book.findMany({ select: { id: true } });
  let n = 0;
  for (const { id: bookId } of books) {
    const distinctUsers = await prisma.userBook.findMany({
      where: { edition: { bookId } },
      select: { userId: true },
      distinct: ['userId'],
    });
    const agg = await prisma.cawpileRating.aggregate({
      where: { userBook: { status: 'COMPLETED', edition: { bookId } } },
      _count: { _all: true },
      _sum: { average: true },
    });
    const ratingCount = agg._count._all;
    const ratingSum = agg._sum.average ?? 0;
    const bayesianRating = (global.weightC * mean + ratingSum) / (global.weightC + ratingCount);

    await prisma.book.update({
      where: { id: bookId },
      data: { readerCount: distinctUsers.length, ratingCount, ratingSum, bayesianRating },
    });
    n++;
  }
  console.log(`Recomputed ${n} books.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
