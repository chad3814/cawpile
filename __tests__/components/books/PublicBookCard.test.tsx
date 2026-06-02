import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PublicBookCard from '@/components/books/PublicBookCard';
import type { RankedBook } from '@/lib/db/bookRankings';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, string>)} />;
  },
}));

function base(stat: RankedBook['stat']): RankedBook {
  return {
    id: 'b1',
    title: 'The Final Empire',
    authors: ['Brandon Sanderson'],
    coverUrl: 'https://x/cover.jpg',
    stat,
  };
}

describe('PublicBookCard', () => {
  it('links to the book detail page and shows title/author', () => {
    render(<PublicBookCard book={base({ kind: 'readers', value: 42 })} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/b/b1');
    expect(screen.getByText('The Final Empire')).toBeInTheDocument();
    expect(screen.getByText('Brandon Sanderson')).toBeInTheDocument();
  });

  it('renders the readers stat', () => {
    render(<PublicBookCard book={base({ kind: 'readers', value: 42 })} />);
    expect(screen.getByText('42 readers')).toBeInTheDocument();
  });

  it('renders the singular reader stat', () => {
    render(<PublicBookCard book={base({ kind: 'readers', value: 1 })} />);
    expect(screen.getByText('1 reader')).toBeInTheDocument();
  });

  it('renders the rating stat to one decimal', () => {
    render(<PublicBookCard book={base({ kind: 'rating', value: 8.4 })} />);
    expect(screen.getByText('8.4 avg')).toBeInTheDocument();
  });

  it('renders the added-date stat as month + year', () => {
    render(<PublicBookCard book={base({ kind: 'addedAt', value: new Date('2026-05-15T00:00:00Z') })} />);
    expect(screen.getByText(/Added May 2026/)).toBeInTheDocument();
  });

  it('shows a placeholder when there is no cover', () => {
    render(<PublicBookCard book={{ ...base({ kind: 'readers', value: 2 }), coverUrl: null }} />);
    expect(screen.getByTestId('cover-placeholder')).toBeInTheDocument();
  });
});
