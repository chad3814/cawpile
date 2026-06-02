import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getNewestBooks,
  getPopularBooks,
  getTopRatedBooks,
  type RankedBook,
} from '@/lib/db/bookRankings';
import BooksSectionClient from '@/components/books/BooksSectionClient';
import { BOOKS_PAGE_SIZE } from '@/lib/books/constants';

export const revalidate = 300;

export function generateStaticParams() {
  return [{ section: 'newest' }, { section: 'popular' }, { section: 'top-rated' }];
}

const SECTION_MAP: Record<
  string,
  { title: string; fetcher: (limit: number, offset: number) => Promise<RankedBook[]> }
> = {
  newest: { title: 'Newest', fetcher: getNewestBooks },
  popular: { title: 'Most Popular', fetcher: getPopularBooks },
  'top-rated': { title: 'Top Rated', fetcher: getTopRatedBooks },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const config = SECTION_MAP[section];
  if (!config) {
    return { title: 'Not Found | Cawpile', robots: 'noindex, nofollow' };
  }
  return {
    title: `${config.title} Books | Cawpile`,
    description: `Browse ${config.title.toLowerCase()} books on Cawpile.`,
    robots: 'index, follow',
  };
}

export default async function BooksSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const config = SECTION_MAP[section];
  if (!config) {
    notFound();
  }

  const rows = await config.fetcher(BOOKS_PAGE_SIZE + 1, 0);
  const hasMore = rows.length > BOOKS_PAGE_SIZE;
  const initialBooks = rows.slice(0, BOOKS_PAGE_SIZE);

  return (
    <BooksSectionClient
      section={section}
      title={config.title}
      initialBooks={initialBooks}
      initialHasMore={hasMore}
    />
  );
}
