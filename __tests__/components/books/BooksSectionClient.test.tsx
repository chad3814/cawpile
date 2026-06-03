import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import BooksSectionClient from '@/components/books/BooksSectionClient';
import type { RankedBook } from '@/lib/db/bookRankings';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, string>)} />;
  },
}));

// Capture the IntersectionObserver callback so the test can trigger intersection.
let ioCallback: IntersectionObserverCallback | null = null;
beforeAll(() => {
  class MockIO {
    constructor(cb: IntersectionObserverCallback) {
      ioCallback = cb;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // @ts-expect-error test shim
  global.IntersectionObserver = MockIO;
});

function mk(id: string): RankedBook {
  return { id, title: id, authors: ['A'], coverUrl: null, stat: { kind: 'readers', value: 1 } };
}

describe('BooksSectionClient', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renders the SSR first page', () => {
    render(
      <BooksSectionClient section="popular" title="Popular" initialBooks={[mk('b1')]} initialHasMore={false} />
    );
    expect(screen.getByRole('heading', { name: 'Popular' })).toBeInTheDocument();
    expect(screen.getByText('b1')).toBeInTheDocument();
  });

  it('shows Retry on fetch error and recovers when clicked', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ books: [mk('b2')], hasMore: false }) });
    global.fetch = fetchMock as typeof fetch;

    render(
      <BooksSectionClient section="popular" title="Popular" initialBooks={[mk('b1')]} initialHasMore={true} />
    );

    // First intersection → fetch rejects (ok:false) → error state
    await act(async () => {
      ioCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    const retry = await screen.findByRole('button', { name: /retry/i });

    // Click Retry → second fetch succeeds → b2 appended
    await act(async () => {
      retry.click();
    });

    await waitFor(() => expect(screen.getByText('b2')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fetches and appends the next page when the sentinel intersects', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ books: [mk('b2')], hasMore: false }),
    });
    global.fetch = fetchMock as typeof fetch;

    render(
      <BooksSectionClient section="popular" title="Popular" initialBooks={[mk('b1')]} initialHasMore={true} />
    );

    await act(async () => {
      ioCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    await waitFor(() => expect(screen.getByText('b2')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith('/api/books?section=popular&offset=1&limit=24');
  });

  it('does not render a book twice when a shifted book reappears in the next page', async () => {
    // b1 is already shown; the next page re-surfaces b1 (rank shift) alongside b2.
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ books: [mk('b1'), mk('b2')], hasMore: false }),
    });
    global.fetch = fetchMock as typeof fetch;

    render(
      <BooksSectionClient section="popular" title="Popular" initialBooks={[mk('b1')]} initialHasMore={true} />
    );

    await act(async () => {
      ioCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    });

    await waitFor(() => expect(screen.getByText('b2')).toBeInTheDocument());
    // b1 must still appear exactly once despite being returned again.
    expect(screen.getAllByText('b1')).toHaveLength(1);
  });
});
