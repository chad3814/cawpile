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
      }).format(stat.value);
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
            className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-muted-foreground"
          />
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
