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
});
