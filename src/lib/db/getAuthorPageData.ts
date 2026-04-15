import prisma from '@/lib/prisma';
import type { BookStatus } from '@prisma/client';
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
  // Find all books where the author appears in the authors array.
  // Fetch all editions (not just the first) so we can sum readers across them.
  const books = await prisma.book.findMany({
    where: {
      authors: { has: authorName },
    },
    include: {
      editions: {
        orderBy: { createdAt: 'asc' },
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

  const bookIds = books.map((b) => b.id);

  // Single query: fetch all completed ratings with their bookId via relation
  const ratings = await prisma.cawpileRating.findMany({
    where: {
      userBook: {
        edition: { bookId: { in: bookIds } },
        status: 'COMPLETED',
      },
    },
    select: {
      average: true,
      userBook: { select: { edition: { select: { bookId: true } } } },
    },
  });

  // Aggregate ratings per book
  const bookRatings = new Map<string, { sum: number; count: number }>();
  for (const r of ratings) {
    if (r.average === null) continue;
    const bookId = r.userBook.edition.bookId;
    const existing = bookRatings.get(bookId) ?? { sum: 0, count: 0 };
    existing.sum += r.average;
    existing.count += 1;
    bookRatings.set(bookId, existing);
  }

  // If the user is logged in, fetch their tracked books by this author
  const userTrackedMap = new Map<string, { status: BookStatus; rating: number | null }>();
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
    // Sum readers across all editions
    const readerCount = book.editions.reduce((sum, ed) => sum + ed._count.userBooks, 0);
    totalReaders += readerCount;

    // Use the first edition for the cover image
    const firstEdition = book.editions[0];
    const coverImageUrl = firstEdition ? getCoverImageUrl(firstEdition) ?? null : null;

    const rating = bookRatings.get(book.id);
    const avgRating = rating ? Number((rating.sum / rating.count).toFixed(1)) : null;
    const totalRatings = rating?.count ?? 0;

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
