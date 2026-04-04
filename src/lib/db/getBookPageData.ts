import prisma from '@/lib/prisma';
import { AggregatedCawpileRating, BookPageData, PublicBookReview } from '@/types/book-page';

const FACET_KEYS = ['characters', 'atmosphere', 'writing', 'plot', 'intrigue', 'logic', 'enjoyment'] as const;

const RATING_SELECT = {
  characters: true,
  atmosphere: true,
  writing: true,
  plot: true,
  intrigue: true,
  logic: true,
  enjoyment: true,
  average: true,
} as const;

const REVIEW_LIMIT = 100;

export async function getBookPageData(bookId: string): Promise<BookPageData | null> {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      editions: {
        orderBy: { createdAt: 'asc' },
        take: 1,
        include: {
          googleBook: {
            select: { imageUrl: true, description: true },
          },
          hardcoverBook: {
            select: { imageUrl: true, description: true },
          },
          ibdbBook: {
            select: { imageUrl: true, description: true },
          },
        },
      },
    },
  });

  if (!book || book.editions.length === 0) return null;

  const edition = book.editions[0];

  const completedRatedFilter = {
    userBook: {
      edition: { bookId },
      status: 'COMPLETED' as const,
    },
  };

  // Query 1: Aggregate ratings in the DB — returns a single row
  const [aggregateResult, ratingCount] = await Promise.all([
    prisma.cawpileRating.aggregate({
      where: completedRatedFilter,
      _avg: {
        characters: true,
        atmosphere: true,
        writing: true,
        plot: true,
        intrigue: true,
        logic: true,
        enjoyment: true,
        average: true,
      },
    }),
    prisma.cawpileRating.count({
      where: completedRatedFilter,
    }),
  ]);

  let aggregatedRating: AggregatedCawpileRating | null = null;
  if (ratingCount > 0 && aggregateResult._avg.average !== null) {
    aggregatedRating = {
      ...Object.fromEntries(
        FACET_KEYS.map((key) => [
          key,
          aggregateResult._avg[key] !== null ? Number(aggregateResult._avg[key]!.toFixed(1)) : null,
        ])
      ) as Record<typeof FACET_KEYS[number], number | null>,
      average: Number(aggregateResult._avg.average.toFixed(1)),
    };
  }

  // Query 2: Public reviews, ordered by rating desc then shareToken asc, capped
  const sharedUserBooks = await prisma.userBook.findMany({
    where: {
      edition: { bookId },
      status: 'COMPLETED',
      cawpileRating: { isNot: null },
      sharedReview: { isNot: null },
    },
    orderBy: [
      { cawpileRating: { average: 'desc' } },
      { sharedReview: { shareToken: 'asc' } },
    ],
    take: REVIEW_LIMIT,
    select: {
      review: true,
      finishDate: true,
      cawpileRating: { select: RATING_SELECT },
      sharedReview: {
        select: {
          shareToken: true,
          showDates: true,
          showReview: true,
        },
      },
      user: {
        select: {
          username: true,
          name: true,
          profilePictureUrl: true,
          image: true,
          profileEnabled: true,
        },
      },
    },
  });

  const publicReviews: PublicBookReview[] = sharedUserBooks.map((ub) => ({
    shareToken: ub.sharedReview!.shareToken,
    user: ub.user,
    rating: ub.cawpileRating!,
    review: ub.sharedReview!.showReview ? ub.review : null,
    finishDate: ub.sharedReview!.showDates && ub.finishDate ? ub.finishDate.toISOString() : null,
  }));

  return {
    book: {
      id: book.id,
      title: book.title,
      authors: book.authors,
      bookType: book.bookType,
    },
    edition: {
      id: edition.id,
      title: edition.title,
      defaultCoverProvider: edition.defaultCoverProvider,
      googleBook: edition.googleBook,
      hardcoverBook: edition.hardcoverBook,
      ibdbBook: edition.ibdbBook,
    },
    aggregatedRating,
    publicReviews,
    reviewsCapped: publicReviews.length >= REVIEW_LIMIT,
    totalRatingCount: ratingCount,
  };
}
