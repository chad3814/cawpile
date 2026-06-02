'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PublicBookCard from './PublicBookCard';
import type { RankedBook } from '@/lib/db/bookRankings';

interface BooksSectionClientProps {
  section: string;
  title: string;
  initialBooks: RankedBook[];
  initialHasMore: boolean;
}

const PAGE_SIZE = 24;

export default function BooksSectionClient({
  section,
  title,
  initialBooks,
  initialHasMore,
}: BooksSectionClientProps) {
  const [books, setBooks] = useState<RankedBook[]>(initialBooks);
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
        `/api/books?section=${section}&offset=${books.length}&limit=${PAGE_SIZE}`
      );
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data: { books: RankedBook[]; hasMore: boolean } = await res.json();
      setBooks((prev) => [...prev, ...data.books]);
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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {books.map((book) => (
          <PublicBookCard key={book.id} book={book} />
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
