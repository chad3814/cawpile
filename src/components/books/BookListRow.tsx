import Link from 'next/link';
import Image from 'next/image';
import StarRating from '@/components/rating/StarRating';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { formatBookStat } from '@/lib/books/formatBookStat';
import type { RankedBookDetail } from '@/lib/db/bookRankings';

export default function BookListRow({ book }: { book: RankedBookDetail }) {
  // The rating stat is already shown by the rating block, so only addedAt/readers
  // get a dedicated section-stat line.
  const sectionStat = book.stat.kind === 'rating' ? null : formatBookStat(book.stat);

  return (
    <Link
      href={`/b/${book.id}`}
      aria-label={book.title}
      className="group flex gap-5 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
    >
      <div className="relative aspect-[2/3] w-24 flex-none overflow-hidden rounded-md bg-muted">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            data-testid="cover-placeholder"
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center"
          >
            <svg
              className="w-8 h-10 text-muted-foreground/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-card-foreground">{book.title}</h3>
        <p className="text-sm text-muted-foreground">{book.authors.join(', ')}</p>

        <div className="mt-2 flex items-center gap-2">
          <StarRating rating={book.averageRating} showAverage={false} size="sm" />
          {book.averageRating !== null && (
            <span className="text-xs text-muted-foreground">({book.averageRating.toFixed(1)}/10)</span>
          )}
        </div>
        {book.ratingCount > 0 && (
          <p className="text-xs text-muted-foreground">
            Based on {book.ratingCount} {book.ratingCount === 1 ? 'rating' : 'ratings'}
          </p>
        )}

        {sectionStat && <p className="mt-1 text-xs font-medium text-primary">{sectionStat}</p>}

        {book.description && (
          <div
            className="mt-2 line-clamp-3 text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(book.description) }}
          />
        )}
      </div>
    </Link>
  );
}
