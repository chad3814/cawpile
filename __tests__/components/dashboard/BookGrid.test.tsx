import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookGrid from '@/components/dashboard/BookGrid';
import type { DashboardBookData } from '@/types/dashboard';

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('@/components/dashboard/BookCard', () => ({
  __esModule: true,
  default: ({ book }: { book: DashboardBookData }) => (
    <div data-testid={`book-card-${book.id}`}>{book.edition.book.title}</div>
  ),
}));

jest.mock('@/components/dashboard/EmptyLibrary', () => ({
  __esModule: true,
  default: () => <div data-testid="empty-library">No books yet</div>,
}));

const makeBook = (id: string, status: DashboardBookData['status'], title: string): DashboardBookData => ({
  id,
  status,
  format: [],
  progress: 0,
  startDate: null,
  finishDate: null,
  createdAt: new Date('2024-01-01'),
  edition: {
    id: `edition-${id}`,
    title: null,
    book: { id: `book-${id}`, title, authors: ['Author'] },
    googleBook: null,
    hardcoverBook: null,
    ibdbBook: null,
  },
  cawpileRating: null,
  sharedReview: null,
});

describe('BookGrid', () => {
  const getSectionTitle = (name: string) =>
    screen.queryByRole('link', { name });

  it('renders empty state when no books', () => {
    render(<BookGrid books={[]} />);
    expect(screen.getByTestId('empty-library')).toBeInTheDocument();
  });

  it('renders Currently Reading section for READING books', () => {
    const books = [makeBook('1', 'READING', 'Reading Book')];
    render(<BookGrid books={books} />);
    expect(getSectionTitle('Currently Reading')).toBeInTheDocument();
    expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
  });

  it('renders To Be Read section for WANT_TO_READ books', () => {
    const books = [makeBook('1', 'WANT_TO_READ', 'TBR Book')];
    render(<BookGrid books={books} />);
    expect(getSectionTitle('To Be Read')).toBeInTheDocument();
    expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
  });

  it('renders Completed section for COMPLETED books', () => {
    const books = [makeBook('1', 'COMPLETED', 'Completed Book')];
    render(<BookGrid books={books} />);
    expect(getSectionTitle('Completed')).toBeInTheDocument();
    expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
  });

  it('renders Completed section for DNF books', () => {
    const books = [makeBook('1', 'DNF', 'DNF Book')];
    render(<BookGrid books={books} />);
    expect(getSectionTitle('Completed')).toBeInTheDocument();
    expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
  });

  it('renders all three sections when books exist in each status', () => {
    const books = [
      makeBook('1', 'READING', 'Reading Book'),
      makeBook('2', 'WANT_TO_READ', 'TBR Book'),
      makeBook('3', 'COMPLETED', 'Completed Book'),
    ];
    render(<BookGrid books={books} />);
    expect(getSectionTitle('Currently Reading')).toBeInTheDocument();
    expect(getSectionTitle('To Be Read')).toBeInTheDocument();
    expect(getSectionTitle('Completed')).toBeInTheDocument();
  });

  it('shows empty text for TBR section when no WANT_TO_READ books', () => {
    const books = [
      makeBook('1', 'READING', 'Reading Book'),
      makeBook('2', 'COMPLETED', 'Completed Book'),
    ];
    render(<BookGrid books={books} />);
    expect(screen.getByText('No books in your TBR list.')).toBeInTheDocument();
  });

  it('shows empty text for Completed section when no COMPLETED or DNF books', () => {
    const books = [
      makeBook('1', 'READING', 'Reading Book'),
      makeBook('2', 'WANT_TO_READ', 'TBR Book'),
    ];
    render(<BookGrid books={books} />);
    expect(screen.getByText('No completed books yet.')).toBeInTheDocument();
  });

  it('shows empty text for Currently Reading section when no READING books', () => {
    const books = [
      makeBook('1', 'WANT_TO_READ', 'TBR Book'),
      makeBook('2', 'COMPLETED', 'Completed Book'),
    ];
    render(<BookGrid books={books} />);
    expect(screen.getByText('No books currently being read.')).toBeInTheDocument();
  });

  it('renders books inside a clipped carousel container', () => {
    const books = [makeBook('1', 'READING', 'Reading Book')];
    const { container } = render(<BookGrid books={books} />);
    expect(container.querySelector('.overflow-hidden')).toBeInTheDocument();
    const track = container.querySelector('.overflow-hidden > div');
    expect(track?.className).toContain('flex');
  });

  it('places DNF and COMPLETED books together in Completed section', () => {
    const books = [
      makeBook('1', 'COMPLETED', 'Completed Book'),
      makeBook('2', 'DNF', 'DNF Book'),
    ];
    render(<BookGrid books={books} />);
    expect(getSectionTitle('Completed')).toBeInTheDocument();
    expect(screen.getByTestId('book-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('book-card-2')).toBeInTheDocument();
  });
});
