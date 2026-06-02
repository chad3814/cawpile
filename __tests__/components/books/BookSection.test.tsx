import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookSection from '@/components/books/BookSection';
import type { RankedBook } from '@/lib/db/bookRankings';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, string>)} />;
  },
}));

const books: RankedBook[] = [
  { id: 'b1', title: 'One', authors: ['A'], coverUrl: null, stat: { kind: 'readers', value: 3 } },
  { id: 'b2', title: 'Two', authors: ['B'], coverUrl: null, stat: { kind: 'readers', value: 2 } },
];

describe('BookSection', () => {
  it('renders the title, cards, and a view-all link to the section', () => {
    render(<BookSection title="Popular" slug="popular" books={books} />);
    expect(screen.getByRole('heading', { name: 'Popular', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    const viewAll = screen.getByRole('link', { name: /view all/i });
    expect(viewAll).toHaveAttribute('href', '/books/popular');
  });

  it('renders nothing when there are no books', () => {
    const { container } = render(<BookSection title="Popular" slug="popular" books={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
