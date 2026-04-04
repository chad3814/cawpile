import prisma from '@/lib/prisma';
import { AggregatedCawpileRating, BookPageData, PublicBookReview } from '@/types/book-page';

const FACET_KEYS = ['characters', 'atmosphere', 'writing', 'plot', 'intrigue', 'logic', 'enjoyment'] as const;

function computeAggregatedRating(
  ratings: { characters: number | null; atmosphere: number | null; writing: number | null; plot: number | null; intrigue: number | null; logic: number | null; enjoyment: number | null; average: number }[]
): AggregatedCawpileRating | null {
  if (ratings.length === 0) return null;

  const facetMeans = Object.fromEntries(
    FACET_KEYS.map((key) => {
      const values = ratings.map((r) => r[key]).filter((v): v is number => v !== null);
      return [key, values.length > 0 ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)) : null];
    })
  ) as Record<typeof FACET_KEYS[number], number | null>;

  const averages = ratings.map((r) => r.average);
  const overallAverage = Number((averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(1));

  return {
    ...facetMeans,
    average: overallAverage,
  };
}

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

  const ratedUserBooks = await prisma.userBook.findMany({
    where: {
      edition: { bookId },
      status: 'COMPLETED',
      cawpileRating: { isNot: null },
    },
    include: {
      cawpileRating: true,
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

  const allRatings = ratedUserBooks
    .map((ub) => ub.cawpileRating)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const aggregatedRating = computeAggregatedRating(allRatings);

  const publicReviews: PublicBookReview[] = ratedUserBooks
    .filter((ub) => ub.sharedReview !== null)
    .map((ub) => ({
      shareToken: ub.sharedReview!.shareToken,
      user: ub.user,
      rating: {
        average: ub.cawpileRating!.average,
        characters: ub.cawpileRating!.characters,
        atmosphere: ub.cawpileRating!.atmosphere,
        writing: ub.cawpileRating!.writing,
        plot: ub.cawpileRating!.plot,
        intrigue: ub.cawpileRating!.intrigue,
        logic: ub.cawpileRating!.logic,
        enjoyment: ub.cawpileRating!.enjoyment,
      },
      review: ub.sharedReview!.showReview ? ub.review : null,
      finishDate: ub.sharedReview!.showDates ? ub.finishDate : null,
      showDates: ub.sharedReview!.showDates,
      showReview: ub.sharedReview!.showReview,
    }))
    .sort((a, b) => b.rating.average - a.rating.average);

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
    totalRatingCount: allRatings.length,
  };
}
