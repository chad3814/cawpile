jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: { book: { findMany: jest.fn() } },
}));

import prisma from '@/lib/prisma';
import { getNewestBooks, getPopularBooks, getTopRatedBooks } from '@/lib/db/bookRankings';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'b1',
    title: 'Book One',
    authors: ['Author A'],
    createdAt: new Date('2026-05-01T00:00:00Z'),
    readerCount: 42,
    bayesianRating: 8.37,
    editions: [
      {
        defaultCoverProvider: null,
        customCoverUrl: null,
        hardcoverBook: { imageUrl: 'https://x/cover.jpg' },
        googleBook: null,
        ibdbBook: null,
        amazonBook: null,
      },
    ],
    ...overrides,
  };
}

describe('bookRankings', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getNewestBooks maps to RankedBook with addedAt stat', async () => {
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([row()]);
    const result = await getNewestBooks(12, 0);
    expect(mockPrisma.book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take: 12,
        skip: 0,
      })
    );
    expect(result[0]).toEqual({
      id: 'b1',
      title: 'Book One',
      authors: ['Author A'],
      coverUrl: 'https://x/cover.jpg',
      stat: { kind: 'addedAt', value: '2026-05-01T00:00:00.000Z' },
    });
  });

  it('getPopularBooks orders by readerCount and emits readers stat', async () => {
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([row()]);
    const result = await getPopularBooks(24, 24);
    expect(mockPrisma.book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ readerCount: 'desc' }, { id: 'asc' }],
        take: 24,
        skip: 24,
      })
    );
    expect(result[0].stat).toEqual({ kind: 'readers', value: 42 });
  });

  it('getTopRatedBooks filters ratingCount > 0 and rounds the rating stat', async () => {
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([row()]);
    const result = await getTopRatedBooks(10, 0);
    expect(mockPrisma.book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ratingCount: { gt: 0 } },
        orderBy: [{ bayesianRating: 'desc' }, { id: 'asc' }],
      })
    );
    expect(result[0].stat).toEqual({ kind: 'rating', value: 8.4 });
  });

  it('returns coverUrl null when the book has no edition', async () => {
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([row({ editions: [] })]);
    const result = await getNewestBooks(12, 0);
    expect(result[0].coverUrl).toBeNull();
  });
});
