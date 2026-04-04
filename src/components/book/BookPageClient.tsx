'use client';

import Image from 'next/image';
import Link from 'next/link';
import PublicCawpileFacetDisplay from '@/components/share/PublicCawpileFacetDisplay';
import StarRating from '@/components/rating/StarRating';
import { BookType } from '@/types/cawpile';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl';
import { BookPageData, PublicBookReview } from '@/types/book-page';

interface BookPageClientProps {
  data: BookPageData;
}

function formatDate(date: string | null): string | null {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function ReviewRow({ review }: { review: PublicBookReview }) {
  const displayName = review.user.name || review.user.username || 'Anonymous';
  const avatarUrl = review.user.profilePictureUrl || review.user.image;

  return (
    <tr className="border-t border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {review.user.profileEnabled && review.user.username ? (
            <Link
              href={`/u/${review.user.username}`}
              className="text-sm font-medium text-card-foreground hover:underline"
            >
              {displayName}
            </Link>
          ) : (
            <span className="text-sm font-medium text-card-foreground">{displayName}</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <Link href={`/share/reviews/${review.shareToken}`} className="hover:opacity-80">
          <StarRating rating={review.rating.average} showAverage size="sm" />
        </Link>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        {review.review ? (
          <Link
            href={`/share/reviews/${review.shareToken}`}
            className="text-sm text-muted-foreground line-clamp-2 hover:text-card-foreground"
          >
            {review.review}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground/50">--</span>
        )}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="text-sm text-muted-foreground">
          {review.finishDate ? formatDate(review.finishDate) : '--'}
        </span>
      </td>
    </tr>
  );
}

export default function BookPageClient({ data }: BookPageClientProps) {
  const { book, edition, aggregatedRating, publicReviews, totalRatingCount } = data;

  const displayTitle = edition.title || book.title;
  const imageUrl = getCoverImageUrl(edition);
  const description = edition.googleBook?.description
    || edition.hardcoverBook?.description
    || edition.ibdbBook?.description;
  const bookType = (book.bookType || 'FICTION') as BookType;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        {/* Book Info Header */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            {imageUrl && (
              <div className="flex-shrink-0 w-48 mx-auto sm:mx-0">
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={imageUrl}
                    alt={displayTitle}
                    fill
                    className="object-cover"
                    sizes="192px"
                    priority
                  />
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-card-foreground mb-2">
                {displayTitle}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                {book.authors.join(', ')}
              </p>

              {aggregatedRating && (
                <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <StarRating
                      rating={aggregatedRating.average}
                      showAverage={false}
                      size="lg"
                    />
                    <span className="text-sm text-muted-foreground">
                      ({aggregatedRating.average.toFixed(1)}/10)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on {totalRatingCount} {totalRatingCount === 1 ? 'rating' : 'ratings'}
                  </p>
                </div>
              )}

              {description && (
                <div
                  className="mt-4 text-sm text-muted-foreground line-clamp-6"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Aggregated CAWPILE Rating */}
        {aggregatedRating && (
          <div className="px-6 sm:px-8 pb-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              CAWPILE Rating Breakdown
            </h2>
            <PublicCawpileFacetDisplay
              rating={aggregatedRating}
              bookType={bookType}
            />
          </div>
        )}

        {/* Public Reviews Table */}
        <div className="px-6 sm:px-8 pb-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            Public Reviews{publicReviews.length > 0 ? ` (${publicReviews.length})` : ''}
          </h2>

          {publicReviews.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Rating</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">Review</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">Finished</th>
                  </tr>
                </thead>
                <tbody>
                  {publicReviews.map((review) => (
                    <ReviewRow key={review.shareToken} review={review} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No public reviews yet.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 bg-muted/30 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Powered by CAWPILE.org
          </p>
        </div>
      </div>
    </div>
  );
}
