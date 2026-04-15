import prisma from '@/lib/prisma';
import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl';
import type { AuthorPageData, AuthorBookEntry, TrackedBookEntry } from '@/types/author-page';

const COVER_PROVIDERS_SELECT = {
  googleBook: { select: { imageUrl: true } },
  hardcoverBook: { select: { imageUrl: true } },
  ibdbBook: { select: { imageUrl: true } },
} as const;

export async function getAuthorPageData(
  authorName: string,
  userId: string | null
): Promise<AuthorPageData | null> {
  // Find all books where the author appears in the authors array
  const books = await prisma.book.findMany({
    where: {
      authors: { has: authorName },
    },
    include: {
      editions: {
        orderBy: { createdAt: 'asc' },
        take: 1,
        include: {
          ...COVER_PROVIDERS_SELECT,
          _count: {
            select: { userBooks: true },
          },
        },
      },
    },
    orderBy: { title: 'asc' },
  });

  if (books.length === 0) return null;

  // Gather all book IDs for aggregated rating queries
  const bookIds = books.map((b) => b.id);

  // Batch query: aggregated ratings per book
  const ratingsByBook = await prisma.cawpileRating.groupBy({
    by: ['userBookId'],
    where: {
      userBook: {
        edition: { bookId: { in: bookIds } },
        status: 'COMPLETED',
      },
    },
    _avg: { average: true },
    _count: true,
  });

  // We need the bookId for each userBookId to map ratings back to books.
  // Get the userBook → edition → bookId mapping for the rated userBooks.
  const ratedUserBookIds = ratingsByBook.map((r) => r.userBookId);
  const userBookEditions = ratedUserBookIds.length > 0
    ? await prisma.userBook.findMany({
        where: { id: { in: ratedUserBookIds } },
        select: { id: true, edition: { select: { bookId: true } } },
      })
    : [];

  const userBookToBookId = new Map(
    userBookEditions.map((ub) => [ub.id, ub.edition.bookId])
  );

  // Aggregate ratings per book
  const bookRatings = new Map<string, { sum: number; count: number }>();
  for (const r of ratingsByBook) {
    if (r._avg.average === null) continue;
    const bookId = userBookToBookId.get(r.userBookId);
    if (!bookId) continue;
    const existing = bookRatings.get(bookId) ?? { sum: 0, count: 0 };
    existing.sum += r._avg.average * r._count;
    existing.count += r._count;
    bookRatings.set(bookId, existing);
  }

  // If the user is logged in, fetch their tracked books by this author
  const userTrackedMap = new Map<string, { status: string; rating: number | null }>();
  if (userId) {
    const userBooks = await prisma.userBook.findMany({
      where: {
        userId,
        edition: { bookId: { in: bookIds } },
      },
      select: {
        edition: { select: { bookId: true } },
        status: true,
        cawpileRating: { select: { average: true } },
      },
    });
    for (const ub of userBooks) {
      userTrackedMap.set(ub.edition.bookId, {
        status: ub.status,
        rating: ub.cawpileRating?.average ?? null,
      });
    }
  }

  // Build book entries
  const trackedBooks: TrackedBookEntry[] = [];
  const otherBooks: AuthorBookEntry[] = [];
  let totalReaders = 0;

  for (const book of books) {
    const edition = book.editions[0];
    const readerCount = edition?._count.userBooks ?? 0;
    totalReaders += readerCount;

    const rating = bookRatings.get(book.id);
    const avgRating = rating ? Number((rating.sum / rating.count).toFixed(1)) : null;
    const totalRatings = rating?.count ?? 0;

    const coverImageUrl = edition ? getCoverImageUrl(edition) ?? null : null;

    const entry: AuthorBookEntry = {
      bookId: book.id,
      title: book.title,
      bookType: book.bookType,
      coverImageUrl,
      averageRating: avgRating,
      totalRatings,
      totalReaders: readerCount,
    };

    const tracked = userTrackedMap.get(book.id);
    if (tracked) {
      trackedBooks.push({
        ...entry,
        userBookStatus: tracked.status,
        userRating: tracked.rating,
      });
    } else {
      otherBooks.push(entry);
    }
  }

  return {
    authorName,
    totalBooks: books.length,
    totalReaders,
    trackedBooks,
    otherBooks,
  };
}
