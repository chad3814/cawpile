import type { BookStat } from '@/lib/db/bookRankings';

/**
 * Human-readable label for a book's ranking stat. Type-only import of BookStat
 * keeps this module free of the prisma import in bookRankings, so client
 * components can use it.
 */
export function formatBookStat(stat: BookStat): string {
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
