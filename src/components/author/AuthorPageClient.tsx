'use client';

import Image from 'next/image';
import Link from 'next/link';
import StarRating from '@/components/rating/StarRating';
import type { AuthorPageData, AuthorBookEntry, TrackedBookEntry } from '@/types/author-page';

interface AuthorPageClientProps {
  data: AuthorPageData;
}

const STATUS_LABELS: Record<string, string> = {
  READING: 'Reading',
  WANT_TO_READ: 'TBR',
  COMPLETED: 'Completed',
  DNF: 'DNF',
};

const STATUS_CLASSES: Record<string, string> = {
  READING: 'bg-blue-500/10 text-blue-400',
  WANT_TO_READ: 'bg-amber-500/10 text-amber-400',
  COMPLETED: 'bg-green-500/10 text-green-400',
  DNF: 'bg-red-500/10 text-red-400',
};

function BookRow({ book }: { book: AuthorBookEntry }) {
  return (
    <tr className="border-t border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/b/${book.bookId}`} className="flex items-center gap-3">
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={book.title}
              width={40}
              height={60}
              className="rounded object-cover"
            />
          ) : (
            <div className="w-10 h-[60px] rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
              No cover
            </div>
          )}
          <span className="text-sm font-medium text-card-foreground hover:underline">
            {book.title}
          </span>
        </Link>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="text-xs text-muted-foreground">
          {book.bookType === 'NONFICTION' ? 'Non-fiction' : 'Fiction'}
        </span>
      </td>
      <td className="px-4 py-3">
        {book.averageRating !== null ? (
          <StarRating rating={book.averageRating} showAverage size="sm" />
        ) : (
          <span className="text-sm text-muted-foreground/50">--</span>
        )}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {book.totalRatings > 0 ? book.totalRatings : '--'}
        </span>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {book.totalReaders > 0 ? book.totalReaders : '--'}
        </span>
      </td>
    </tr>
  );
}

function TrackedBookRow({ book }: { book: TrackedBookEntry }) {
  const statusLabel = STATUS_LABELS[book.userBookStatus] ?? book.userBookStatus;
  const statusClass = STATUS_CLASSES[book.userBookStatus] ?? 'bg-muted text-muted-foreground';

  return (
    <tr className="border-t border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/b/${book.bookId}`} className="flex items-center gap-3">
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
              alt={book.title}
              width={40}
              height={60}
              className="rounded object-cover"
            />
          ) : (
            <div className="w-10 h-[60px] rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
              No cover
            </div>
          )}
          <span className="text-sm font-medium text-card-foreground hover:underline">
            {book.title}
          </span>
        </Link>
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="text-xs text-muted-foreground">
          {book.bookType === 'NONFICTION' ? 'Non-fiction' : 'Fiction'}
        </span>
      </td>
      <td className="px-4 py-3">
        {book.averageRating !== null ? (
          <StarRating rating={book.averageRating} showAverage size="sm" />
        ) : (
          <span className="text-sm text-muted-foreground/50">--</span>
        )}
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {book.totalRatings > 0 ? book.totalRatings : '--'}
        </span>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {book.totalReaders > 0 ? book.totalReaders : '--'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
          {statusLabel}
        </span>
      </td>
    </tr>
  );
}

function BooksTableHeader({ showStatus }: { showStatus: boolean }) {
  return (
    <thead>
      <tr className="border-b border-border">
        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Book</th>
        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">Type</th>
        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Rating</th>
        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">Ratings</th>
        <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground hidden md:table-cell">Readers</th>
        {showStatus && (
          <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Status</th>
        )}
      </tr>
    </thead>
  );
}

export default function AuthorPageClient({ data }: AuthorPageClientProps) {
  const { authorName, totalBooks, totalReaders, trackedBooks, otherBooks } = data;
  const hasTrackedBooks = trackedBooks.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
        {/* Author Header */}
        <div className="p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-card-foreground mb-2">
            {authorName}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{totalBooks} {totalBooks === 1 ? 'book' : 'books'}</span>
            {totalReaders > 0 && (
              <>
                <span className="text-border">|</span>
                <span>{totalReaders} {totalReaders === 1 ? 'reader' : 'readers'}</span>
              </>
            )}
          </div>
        </div>

        {/* Tracked Books Section */}
        {hasTrackedBooks && (
          <div className="px-6 sm:px-8 pb-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              In Your Library ({trackedBooks.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <BooksTableHeader showStatus={true} />
                <tbody>
                  {trackedBooks.map((book) => (
                    <TrackedBookRow key={book.bookId} book={book} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Other Books Section */}
        <div className="px-6 sm:px-8 pb-6">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            {hasTrackedBooks
              ? `Other Books (${otherBooks.length})`
              : `Books (${totalBooks})`}
          </h2>

          {otherBooks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <BooksTableHeader showStatus={false} />
                <tbody>
                  {otherBooks.map((book) => (
                    <BookRow key={book.bookId} book={book} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {hasTrackedBooks
                ? 'All books by this author are in your library.'
                : 'No books found.'}
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
