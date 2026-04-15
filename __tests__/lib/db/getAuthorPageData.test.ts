jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    book: { findMany: jest.fn() },
    cawpileRating: { groupBy: jest.fn() },
    userBook: { findMany: jest.fn() },
  },
}));

import prisma from '@/lib/prisma';
import { getAuthorPageData } from '@/lib/db/getAuthorPageData';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

function makeBook(overrides: Record<string, unknown> = {}) {
  return {
    id: 'book-1',
    title: 'The Final Empire',
    authors: ['Brandon Sanderson'],
    bookType: 'FICTION',
    editions: [
      {
        id: 'ed-1',
        defaultCoverProvider: null,
        customCoverUrl: null,
        googleBook: { imageUrl: 'https://example.com/cover.jpg' },
        hardcoverBook: null,
        ibdbBook: null,
        _count: { userBooks: 5 },
      },
    ],
    ...overrides,
  };
}

describe('getAuthorPageData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.cawpileRating.groupBy as jest.Mock).mockResolvedValue([]);
    (mockPrisma.userBook.findMany as jest.Mock).mockResolvedValue([]);
  });

  it('returns null when no books found for the author', async () => {
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getAuthorPageData('Unknown Author', null);

    expect(result).toBeNull();
    expect(mockPrisma.book.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { authors: { has: 'Unknown Author' } },
      })
    );
  });

  it('returns author page data with books', async () => {
    const book1 = makeBook();
    const book2 = makeBook({
      id: 'book-2',
      title: 'The Well of Ascension',
      editions: [
        {
          id: 'ed-2',
          defaultCoverProvider: null,
          customCoverUrl: null,
          googleBook: { imageUrl: 'https://example.com/cover2.jpg' },
          hardcoverBook: null,
          ibdbBook: null,
          _count: { userBooks: 3 },
        },
      ],
    });
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([book1, book2]);

    const result = await getAuthorPageData('Brandon Sanderson', null);

    expect(result).not.toBeNull();
    expect(result!.authorName).toBe('Brandon Sanderson');
    expect(result!.totalBooks).toBe(2);
    expect(result!.totalReaders).toBe(8);
    expect(result!.trackedBooks).toHaveLength(0);
    expect(result!.otherBooks).toHaveLength(2);
    expect(result!.otherBooks[0].title).toBe('The Final Empire');
    expect(result!.otherBooks[0].coverImageUrl).toBe('https://example.com/cover.jpg');
  });

  it('separates tracked books from other books when user is logged in', async () => {
    const book1 = makeBook();
    const book2 = makeBook({
      id: 'book-2',
      title: 'The Well of Ascension',
      editions: [
        {
          id: 'ed-2',
          defaultCoverProvider: null,
          customCoverUrl: null,
          googleBook: null,
          hardcoverBook: null,
          ibdbBook: null,
          _count: { userBooks: 2 },
        },
      ],
    });
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([book1, book2]);

    // User has tracked book-1 but not book-2
    (mockPrisma.userBook.findMany as jest.Mock).mockResolvedValue([
      {
        edition: { bookId: 'book-1' },
        status: 'COMPLETED',
        cawpileRating: { average: 8.5 },
      },
    ]);

    const result = await getAuthorPageData('Brandon Sanderson', 'user-123');

    expect(result!.trackedBooks).toHaveLength(1);
    expect(result!.trackedBooks[0].bookId).toBe('book-1');
    expect(result!.trackedBooks[0].userBookStatus).toBe('COMPLETED');
    expect(result!.trackedBooks[0].userRating).toBe(8.5);
    expect(result!.otherBooks).toHaveLength(1);
    expect(result!.otherBooks[0].bookId).toBe('book-2');
  });

  it('does not fetch user books when userId is null', async () => {
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([makeBook()]);

    await getAuthorPageData('Brandon Sanderson', null);

    // userBook.findMany should only be called for ratings mapping, not for user's tracked books
    const userBookCalls = (mockPrisma.userBook.findMany as jest.Mock).mock.calls;
    // With no ratings, it should not be called for user tracking (userId is null)
    expect(userBookCalls.every(
      (call: Record<string, unknown>[]) => !call[0] || !(call[0] as Record<string, unknown>).where || !((call[0] as Record<string, { userId?: string }>).where as Record<string, unknown>).userId
    )).toBe(true);
  });

  it('includes aggregated ratings when available', async () => {
    const book = makeBook();
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([book]);

    (mockPrisma.cawpileRating.groupBy as jest.Mock).mockResolvedValue([
      { userBookId: 'ub-1', _avg: { average: 8.0 }, _count: 3 },
      { userBookId: 'ub-2', _avg: { average: 7.0 }, _count: 2 },
    ]);

    // Map userBook IDs back to book IDs
    (mockPrisma.userBook.findMany as jest.Mock).mockResolvedValue([
      { id: 'ub-1', edition: { bookId: 'book-1' } },
      { id: 'ub-2', edition: { bookId: 'book-1' } },
    ]);

    const result = await getAuthorPageData('Brandon Sanderson', null);

    expect(result!.otherBooks[0].averageRating).toBe(7.6); // (8*3 + 7*2) / 5 = 7.6
    expect(result!.otherBooks[0].totalRatings).toBe(5);
  });

  it('handles books with no editions gracefully', async () => {
    const bookNoEditions = makeBook({
      editions: [],
    });
    (mockPrisma.book.findMany as jest.Mock).mockResolvedValue([bookNoEditions]);

    const result = await getAuthorPageData('Brandon Sanderson', null);

    expect(result!.otherBooks[0].coverImageUrl).toBeNull();
    expect(result!.otherBooks[0].totalReaders).toBe(0);
  });
});
