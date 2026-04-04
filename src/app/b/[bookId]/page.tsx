import { cache } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getBookPageData } from '@/lib/db/getBookPageData';
import { stripHtmlToText } from '@/lib/utils/sanitize';
import { getCoverImageUrl } from '@/lib/utils/getCoverImageUrl';
import BookPageClient from '@/components/book/BookPageClient';

interface PageProps {
  params: Promise<{
    bookId: string;
  }>;
}

export const revalidate = 60;

const getCachedBookPageData = cache(getBookPageData);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bookId } = await params;
  const data = await getCachedBookPageData(bookId);

  if (!data) {
    return {
      title: 'Book Not Found | Cawpile',
      robots: 'noindex, nofollow',
    };
  }

  const title = data.book.title;
  const authors = data.book.authors.join(', ');
  const rawDescription = data.edition.googleBook?.description
    || data.edition.hardcoverBook?.description
    || data.edition.ibdbBook?.description;
  const description = rawDescription
    ? stripHtmlToText(rawDescription).substring(0, 160)
    : `${title} by ${authors} on Cawpile`;

  const coverImageUrl = getCoverImageUrl(data.edition);

  return {
    title: `${title} by ${authors} | Cawpile`,
    description,
    robots: 'index, follow',
    openGraph: {
      title: `${title} by ${authors}`,
      description,
      type: 'book',
      ...(coverImageUrl ? { images: [{ url: coverImageUrl }] } : {}),
    },
    twitter: {
      card: coverImageUrl ? 'summary_large_image' : 'summary',
      title: `${title} by ${authors} | Cawpile`,
      description,
    },
  };
}

export default async function BookPage({ params }: PageProps) {
  const { bookId } = await params;
  const data = await getCachedBookPageData(bookId);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <BookPageClient data={data} />
    </div>
  );
}
