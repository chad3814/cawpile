import Link from 'next/link';
import PublicBookCard from './PublicBookCard';
import type { RankedBook } from '@/lib/db/bookRankings';

interface BookSectionProps {
  title: string;
  slug: string;
  books: RankedBook[];
}

export default function BookSection({ title, slug, books }: BookSectionProps) {
  if (books.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <Link href={`/books/${slug}`} className="text-sm font-medium text-primary hover:underline">
          View all &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {books.map((book) => (
          <PublicBookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
