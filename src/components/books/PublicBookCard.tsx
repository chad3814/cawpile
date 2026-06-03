import Link from 'next/link';
import Image from 'next/image';
import type { RankedBook, BookStat } from '@/lib/db/bookRankings';

function formatStat(stat: BookStat): string {
  switch (stat.kind) {
    case 'addedAt': {
      const label = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(stat.value));
      return `Added ${label}`;
    }
    case 'readers':
      return `${stat.value} ${stat.value === 1 ? 'reader' : 'readers'}`;
    case 'rating':
      return `${stat.value.toFixed(1)} avg`;
    default: {
      const _exhaustive: never = stat;
      return _exhaustive;
    }
  }
}

export default function PublicBookCard({ book }: { book: RankedBook }) {
  return (
    <Link
      href={`/b/${book.id}`}
      aria-label={book.title}
      className="group flex flex-col rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-muted">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 200px"
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
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-card-foreground">
        {book.title}
      </h3>
      <p className="line-clamp-1 text-xs text-muted-foreground">{book.authors.join(', ')}</p>
      <p className="mt-1 text-xs font-medium text-primary">{formatStat(book.stat)}</p>
    </Link>
  );
}
