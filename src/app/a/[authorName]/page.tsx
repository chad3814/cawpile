import { cache } from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getAuthorPageData } from '@/lib/db/getAuthorPageData';
import { auth } from '@/lib/auth';
import AuthorPageClient from '@/components/author/AuthorPageClient';

interface PageProps {
  params: Promise<{
    authorName: string;
  }>;
}

const getCachedAuthorPageData = cache(getAuthorPageData);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { authorName: rawName } = await params;
  const authorName = decodeURIComponent(rawName);
  const data = await getCachedAuthorPageData(authorName, null);

  if (!data) {
    return {
      title: 'Author Not Found | Cawpile',
      robots: 'noindex, nofollow',
    };
  }

  const description = `${data.totalBooks} ${data.totalBooks === 1 ? 'book' : 'books'} by ${authorName} on Cawpile`;

  return {
    title: `${authorName} | Cawpile`,
    description,
    robots: 'index, follow',
    openGraph: {
      title: `${authorName} — Books`,
      description,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${authorName} | Cawpile`,
      description,
    },
  };
}

export default async function AuthorPage({ params }: PageProps) {
  const { authorName: rawName } = await params;
  const authorName = decodeURIComponent(rawName);
  const session = await auth();
  const data = await getCachedAuthorPageData(authorName, session?.user?.id ?? null);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <AuthorPageClient data={data} />
    </div>
  );
}
