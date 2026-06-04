'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import BookListRow from './BookListRow';
import type { RankedBookDetail } from '@/lib/db/bookRankings';
import { BOOKS_PAGE_SIZE } from '@/lib/books/constants';

interface BooksSectionClientProps {
  section: string;
  title: string;
  initialBooks: RankedBookDetail[];
  initialHasMore: boolean;
}

export default function BooksSectionClient({
  section,
  title,
  initialBooks,
  initialHasMore,
}: BooksSectionClientProps) {
  const [books, setBooks] = useState<RankedBookDetail[]>(initialBooks);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(
        `/api/books?section=${section}&offset=${books.length}&limit=${BOOKS_PAGE_SIZE}`
      );
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: { books: RankedBookDetail[]; hasMore: boolean } = await res.json();
      // Ranking sort keys shift as users track and rate books, so offset paging can
      // re-surface an already-shown book. Drop duplicates so a shifted book is never
      // rendered twice (which would also collide on the React key).
      setBooks((prev) => {
        const seen = new Set(prev.map((book) => book.id));
        return [...prev, ...data.books.filter((book) => !seen.has(book.id))];
      });
      setHasMore(data.hasMore);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, section, books.length]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, hasMore]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{title}</h1>
      <div className="flex flex-col gap-4">
        {books.map((book) => (
          <BookListRow key={book.id} book={book} />
        ))}
      </div>

      {hasMore && !error && <div ref={sentinelRef} className="h-10" aria-hidden="true" />}
      {loading && <p className="mt-6 text-center text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setError(false);
              loadMore();
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      )}
      {!hasMore && !error && !loading && books.length > 0 && (
        <p className="mt-6 text-center text-sm text-muted-foreground">No more books.</p>
      )}
    </div>
  );
}
