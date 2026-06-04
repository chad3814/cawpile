import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookListRow from '@/components/books/BookListRow';
import type { RankedBookDetail } from '@/lib/db/bookRankings';

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, string>)} />;
  },
}));

function book(overrides: Partial<RankedBookDetail> = {}): RankedBookDetail {
  return {
    id: 'b1',
    title: 'Project Hail Mary',
    authors: ['Andy Weir'],
    coverUrl: 'https://x/cover.jpg',
    stat: { kind: 'readers', value: 42 },
    averageRating: 9,
    ratingCount: 12,
    description: '<p>A lone astronaut.</p>',
    ...overrides,
  };
}

describe('BookListRow', () => {
  it('links to the book page and shows title and author', () => {
    render(<BookListRow book={book()} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/b/b1');
    expect(screen.getByText('Project Hail Mary')).toBeInTheDocument();
    expect(screen.getByText('Andy Weir')).toBeInTheDocument();
  });

  it('gives the row link a concise title-and-author accessible name', () => {
    render(<BookListRow book={book()} />);
    expect(screen.getByRole('link')).toHaveAccessibleName('Project Hail Mary by Andy Weir');
  });

  it('falls back to just the title in the accessible name when there are no authors', () => {
    render(<BookListRow book={book({ authors: [] })} />);
    expect(screen.getByRole('link')).toHaveAccessibleName('Project Hail Mary');
  });

  it('shows the score and rating count for a rated book', () => {
    render(<BookListRow book={book({ averageRating: 9, ratingCount: 12 })} />);
    expect(screen.getByText('(9.0/10)')).toBeInTheDocument();
    expect(screen.getByText('Based on 12 ratings')).toBeInTheDocument();
  });

  it('uses singular "rating" for a single rating', () => {
    render(<BookListRow book={book({ ratingCount: 1 })} />);
    expect(screen.getByText('Based on 1 rating')).toBeInTheDocument();
  });

  it('omits the rating count line when there are no ratings', () => {
    render(<BookListRow book={book({ averageRating: null, ratingCount: 0 })} />);
    expect(screen.queryByText(/Based on/)).not.toBeInTheDocument();
  });

  it('renders the section stat for readers but not for a rating stat', () => {
    const { rerender } = render(<BookListRow book={book({ stat: { kind: 'readers', value: 42 } })} />);
    expect(screen.getByText('42 readers')).toBeInTheDocument();
    rerender(<BookListRow book={book({ stat: { kind: 'rating', value: 9 } })} />);
    expect(screen.queryByText(/avg/)).not.toBeInTheDocument();
  });

  it('renders the description as plain text (HTML stripped, entities decoded) and omits it when absent', () => {
    const { rerender } = render(
      <BookListRow book={book({ description: '<p>A lone <b>astronaut</b> &amp; a microbe.</p>' })} />
    );
    // HTML tags are stripped and entities decoded — no markup or raw entities leak.
    expect(screen.getByText('A lone astronaut & a microbe.')).toBeInTheDocument();
    rerender(<BookListRow book={book({ description: null })} />);
    expect(screen.queryByText(/astronaut/)).not.toBeInTheDocument();
  });

  it('shows the cover placeholder when there is no cover', () => {
    render(<BookListRow book={book({ coverUrl: null })} />);
    expect(screen.getByTestId('cover-placeholder')).toBeInTheDocument();
  });

  it('shows "Not rated" for an unrated book', () => {
    render(<BookListRow book={book({ averageRating: null, ratingCount: 0 })} />);
    expect(screen.getByText('Not rated')).toBeInTheDocument();
  });
});
