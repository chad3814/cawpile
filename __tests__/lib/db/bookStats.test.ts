import { recomputeBookStats, NEUTRAL_MEAN } from '@/lib/db/bookStats';
import type { Prisma } from '@prisma/client';

// Build a fake transaction client with just the methods recomputeBookStats uses.
function makeTx(opts: {
  distinctUserIds: string[];
  ratingCount: number;
  ratingSum: number | null;
  oldCount: number;
  oldSum: number;
  global: { weightC: number; ratingsCount: number; ratingsTotal: number };
}) {
  const bookUpdate = jest.fn().mockResolvedValue({});
  const globalUpsert = jest.fn().mockResolvedValue(opts.global);
  const tx = {
    userBook: {
      findMany: jest.fn().mockResolvedValue(
        opts.distinctUserIds.map((userId) => ({ userId }))
      ),
    },
    cawpileRating: {
      aggregate: jest.fn().mockResolvedValue({
        _count: { _all: opts.ratingCount },
        _sum: { average: opts.ratingSum },
      }),
    },
    book: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ ratingCount: opts.oldCount, ratingSum: opts.oldSum }),
      update: bookUpdate,
    },
    globalBookStats: { upsert: globalUpsert },
  } as unknown as Prisma.TransactionClient;
  return { tx, bookUpdate, globalUpsert };
}

describe('recomputeBookStats', () => {
  it('computes readerCount from distinct users and COMPLETED-only rating aggregate', async () => {
    const { tx, bookUpdate, globalUpsert } = makeTx({
      distinctUserIds: ['u1', 'u2', 'u3'],
      ratingCount: 2,
      ratingSum: 17, // averages 8 + 9
      oldCount: 0,
      oldSum: 0,
      global: { weightC: 10, ratingsCount: 2, ratingsTotal: 17 },
    });

    await recomputeBookStats('book-1', tx);

    // global delta applied as increments of (new - old)
    expect(globalUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'global' },
        update: {
          ratingsCount: { increment: 2 },
          ratingsTotal: { increment: 17 },
        },
      })
    );

    // m = 17/2 = 8.5 ; bayesian = (10*8.5 + 17)/(10+2) = (85+17)/12 = 8.5
    expect(bookUpdate).toHaveBeenCalledWith({
      where: { id: 'book-1' },
      data: { readerCount: 3, ratingCount: 2, ratingSum: 17, bayesianRating: 8.5 },
    });
  });

  it('uses NEUTRAL_MEAN when the global ratingsCount is zero', async () => {
    const { tx, bookUpdate } = makeTx({
      distinctUserIds: ['u1'],
      ratingCount: 0,
      ratingSum: null,
      oldCount: 0,
      oldSum: 0,
      global: { weightC: 10, ratingsCount: 0, ratingsTotal: 0 },
    });

    await recomputeBookStats('book-1', tx);

    // m = NEUTRAL_MEAN ; bayesian = (10*NEUTRAL_MEAN + 0)/(10+0) = NEUTRAL_MEAN
    expect(bookUpdate).toHaveBeenCalledWith({
      where: { id: 'book-1' },
      data: { readerCount: 1, ratingCount: 0, ratingSum: 0, bayesianRating: NEUTRAL_MEAN },
    });
  });
});
