import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import prisma from '@/lib/prisma';

type DiversitySource = 'same-book' | 'same-author' | 'user-history';

interface DiversityDefaults {
  lgbtqRepresentation?: string;
  lgbtqDetails?: string;
  disabilityRepresentation?: string;
  disabilityDetails?: string;
  authorPoc?: string;
  authorPocDetails?: string;
  isNewAuthor?: boolean;
}

type DiversitySources = {
  [K in keyof DiversityDefaults]?: DiversitySource;
};

function majorityVote(values: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (v != null) {
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return null;

  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  // On a tie the first-encountered value (per DB row order) wins — intentional,
  // since defaults are best-effort and a strict tie means no clear majority.
  return best;
}

function majorityDetail(
  reviews: { representation: string | null; detail: string | null }[],
  winningRepresentation: string | null
): string | null {
  if (winningRepresentation !== 'Yes') return null;
  const details = reviews
    .filter(r => r.representation === 'Yes' && r.detail != null && r.detail !== '')
    .map(r => r.detail!);
  if (details.length === 0) return null;
  return majorityVote(details);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    const userBook = await prisma.userBook.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        edition: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!userBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    const bookId = userBook.edition.book.id;
    const authors = userBook.edition.book.authors;

    // Fetch same-book reviews (any user, any edition of the same Book) and
    // same-author reviews (any user, any book sharing an author) in parallel
    const [sameBookReviews, sameAuthorReviews, userAuthorBooks] = await Promise.all([
      prisma.userBook.findMany({
        where: {
          id: { not: userBook.id },
          edition: { bookId },
          OR: [
            { lgbtqRepresentation: { not: null } },
            { disabilityRepresentation: { not: null } },
          ],
        },
        select: {
          lgbtqRepresentation: true,
          lgbtqDetails: true,
          disabilityRepresentation: true,
          disabilityDetails: true,
        },
      }),
      authors.length > 0
        ? prisma.userBook.findMany({
            where: {
              id: { not: userBook.id },
              edition: {
                book: {
                  authors: { hasSome: authors },
                },
              },
              authorPoc: { not: null },
            },
            select: {
              authorPoc: true,
              authorPocDetails: true,
            },
          })
        : Promise.resolve([]),
      // User-specific: has the current user read other books by the same author?
      authors.length > 0
        ? prisma.userBook.findFirst({
            where: {
              id: { not: userBook.id },
              userId: user.id,
              edition: {
                book: {
                  authors: { hasSome: authors },
                },
              },
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    const defaults: DiversityDefaults = {};
    const sources: DiversitySources = {};

    // Book-level defaults: LGBTQ+ and disability representation
    if (sameBookReviews.length > 0) {
      const lgbtqVote = majorityVote(sameBookReviews.map(r => r.lgbtqRepresentation));
      if (lgbtqVote) {
        defaults.lgbtqRepresentation = lgbtqVote;
        sources.lgbtqRepresentation = 'same-book';
        const detail = majorityDetail(
          sameBookReviews.map(r => ({
            representation: r.lgbtqRepresentation,
            detail: r.lgbtqDetails,
          })),
          lgbtqVote
        );
        if (detail) {
          defaults.lgbtqDetails = detail;
          sources.lgbtqDetails = 'same-book';
        }
      }

      const disabilityVote = majorityVote(sameBookReviews.map(r => r.disabilityRepresentation));
      if (disabilityVote) {
        defaults.disabilityRepresentation = disabilityVote;
        sources.disabilityRepresentation = 'same-book';
        const detail = majorityDetail(
          sameBookReviews.map(r => ({
            representation: r.disabilityRepresentation,
            detail: r.disabilityDetails,
          })),
          disabilityVote
        );
        if (detail) {
          defaults.disabilityDetails = detail;
          sources.disabilityDetails = 'same-book';
        }
      }
    }

    // Author-level defaults: author POC
    if (sameAuthorReviews.length > 0) {
      const pocVote = majorityVote(sameAuthorReviews.map(r => r.authorPoc));
      if (pocVote) {
        defaults.authorPoc = pocVote;
        sources.authorPoc = 'same-author';
        const detail = majorityDetail(
          sameAuthorReviews.map(r => ({
            representation: r.authorPoc,
            detail: r.authorPocDetails,
          })),
          pocVote
        );
        if (detail) {
          defaults.authorPocDetails = detail;
          sources.authorPocDetails = 'same-author';
        }
      }
    }

    // User-specific: isNewAuthor
    if (userAuthorBooks) {
      defaults.isNewAuthor = false;
      sources.isNewAuthor = 'user-history';
    }

    return NextResponse.json({ defaults, sources });
  } catch (error) {
    console.error('Error fetching diversity defaults:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
