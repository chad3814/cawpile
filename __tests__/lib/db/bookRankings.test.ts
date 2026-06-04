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

  function detailRow(overrides: Record<string, unknown> = {}) {
    return {
      id: 'b1',
      title: 'Book One',
      authors: ['Author A'],
      createdAt: new Date('2026-05-01T00:00:00Z'),
      readerCount: 42,
      bayesianRating: 8.37,
      ratingCount: 4,
      ratingSum: 30,
      editions: [
        {
          defaultCoverProvider: null,
          customCoverUrl: null,
          hardcoverBook: { imageUrl: 'https://x/cover.jpg', description: 'HC desc' },
          googleBook: { imageUrl: null, description: 'Google desc' },
          ibdbBook: null,
          amazonBook: null,
        },
      ],
      ...overrides,
    };
  }

  it('detail mode returns averageRating, ratingCount and description', async () => {
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([detailRow()]);
    const [book] = await getNewestBooks(12, 0, true);
    expect(book.averageRating).toBe(7.5); // 30 / 4 = 7.5
    expect(book.ratingCount).toBe(4);
    expect(book.description).toBe('Google desc'); // google preferred over hardcover
  });

  it('detail mode yields null averageRating when there are no ratings', async () => {
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([
      detailRow({ ratingCount: 0, ratingSum: 0 }),
    ]);
    const [book] = await getNewestBooks(12, 0, true);
    expect(book.averageRating).toBeNull();
  });

  it('detail mode falls back to a null description when no provider has one', async () => {
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([
      detailRow({
        editions: [
          {
            defaultCoverProvider: null,
            customCoverUrl: null,
            hardcoverBook: { imageUrl: 'https://x/cover.jpg', description: null },
            googleBook: null,
            ibdbBook: null,
            amazonBook: null,
          },
        ],
      }),
    ]);
    const [book] = await getNewestBooks(12, 0, true);
    expect(book.description).toBeNull();
  });
});
