import type { Metadata } from 'next';
import { getNewestBooks, getPopularBooks, getTopRatedBooks } from '@/lib/db/bookRankings';
import BookSection from '@/components/books/BookSection';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Browse Books | Cawpile',
  description: 'Discover the newest, most popular, and highest rated books on Cawpile.',
  robots: 'index, follow',
};

const PREVIEW_COUNT = 12;

export default async function BooksPage() {
  const [newest, popular, topRated] = await Promise.all([
    getNewestBooks(PREVIEW_COUNT, 0),
    getPopularBooks(PREVIEW_COUNT, 0),
    getTopRatedBooks(PREVIEW_COUNT, 0),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Browse Books</h1>
      <BookSection title="Newest" slug="newest" books={newest} />
      <BookSection title="Most Popular" slug="popular" books={popular} />
      <BookSection title="Top Rated" slug="top-rated" books={topRated} />
    </div>
  );
}
