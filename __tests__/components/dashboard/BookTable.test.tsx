import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookTable from '@/components/dashboard/BookTable';
import type { DashboardBookData } from '@/types/dashboard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

jest.mock('@/components/dashboard/EmptyLibrary', () => ({
  __esModule: true,
  default: () => <div data-testid="empty-library">No books yet</div>,
}));

jest.mock('@/lib/utils/getCoverImageUrl', () => ({
  getCoverImageUrl: () => null,
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

describe('BookTable', () => {
  it('renders empty state when no books', () => {
    render(<BookTable books={[]} />);
    expect(screen.getByTestId('empty-library')).toBeInTheDocument();
  });

  const getHeading = (name: string) =>
    screen.queryByRole('heading', { name, level: 2 });

  it('renders Currently Reading section for READING books', () => {
    const books = [makeBook('1', 'READING', 'Reading Book')];
    render(<BookTable books={books} />);
    expect(getHeading('Currently Reading')).toBeInTheDocument();
    expect(screen.getAllByText('Reading Book').length).toBeGreaterThan(0);
  });

  it('renders To Be Read section for WANT_TO_READ books', () => {
    const books = [makeBook('1', 'WANT_TO_READ', 'TBR Book')];
    render(<BookTable books={books} />);
    expect(getHeading('To Be Read')).toBeInTheDocument();
    expect(screen.getAllByText('TBR Book').length).toBeGreaterThan(0);
  });

  it('renders Completed section for COMPLETED books', () => {
    const books = [makeBook('1', 'COMPLETED', 'Finished Book')];
    render(<BookTable books={books} />);
    expect(getHeading('Completed')).toBeInTheDocument();
    expect(screen.getAllByText('Finished Book').length).toBeGreaterThan(0);
  });

  it('renders Completed section for DNF books', () => {
    const books = [makeBook('1', 'DNF', 'DNF Book')];
    render(<BookTable books={books} />);
    expect(getHeading('Completed')).toBeInTheDocument();
    expect(screen.getAllByText('DNF Book').length).toBeGreaterThan(0);
  });

  it('renders all three sections when books exist in each status', () => {
    const books = [
      makeBook('1', 'READING', 'Reading Book'),
      makeBook('2', 'WANT_TO_READ', 'TBR Book'),
      makeBook('3', 'COMPLETED', 'Finished Book'),
    ];
    render(<BookTable books={books} />);
    expect(getHeading('Currently Reading')).toBeInTheDocument();
    expect(getHeading('To Be Read')).toBeInTheDocument();
    expect(getHeading('Completed')).toBeInTheDocument();
  });

  it('does not render TBR section when no WANT_TO_READ books', () => {
    const books = [
      makeBook('1', 'READING', 'Reading Book'),
      makeBook('2', 'COMPLETED', 'Finished Book'),
    ];
    render(<BookTable books={books} />);
    expect(getHeading('To Be Read')).not.toBeInTheDocument();
  });

  it('does not render Completed section when no COMPLETED or DNF books', () => {
    const books = [
      makeBook('1', 'READING', 'Reading Book'),
      makeBook('2', 'WANT_TO_READ', 'TBR Book'),
    ];
    render(<BookTable books={books} />);
    expect(getHeading('Completed')).not.toBeInTheDocument();
  });

  it('does not render Currently Reading section when no READING books', () => {
    const books = [
      makeBook('1', 'WANT_TO_READ', 'TBR Book'),
      makeBook('2', 'COMPLETED', 'Finished Book'),
    ];
    render(<BookTable books={books} />);
    expect(getHeading('Currently Reading')).not.toBeInTheDocument();
  });

  it('places DNF and COMPLETED books together in Completed section', () => {
    const books = [
      makeBook('1', 'COMPLETED', 'Finished Book'),
      makeBook('2', 'DNF', 'DNF Book'),
    ];
    render(<BookTable books={books} />);
    expect(getHeading('Completed')).toBeInTheDocument();
    expect(screen.getAllByText('Finished Book').length).toBeGreaterThan(0);
    expect(screen.getAllByText('DNF Book').length).toBeGreaterThan(0);
  });
});
