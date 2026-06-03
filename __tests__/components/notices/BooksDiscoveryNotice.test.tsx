import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BooksDiscoveryNotice from '@/components/notices/BooksDiscoveryNotice';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, string>)} />;
  },
}));

describe('BooksDiscoveryNotice', () => {
  it('announces the Browse Books discovery sections', () => {
    render(<BooksDiscoveryNotice onDismiss={() => {}} />);
    expect(screen.getByText(/browse books/i)).toBeInTheDocument();
    expect(screen.getByText(/newest/i)).toBeInTheDocument();
    expect(screen.getByText(/most popular/i)).toBeInTheDocument();
    expect(screen.getByText(/top rated/i)).toBeInTheDocument();
  });

  it('links "Explore Books" to /books', () => {
    render(<BooksDiscoveryNotice onDismiss={() => {}} />);
    expect(screen.getByRole('link', { name: /explore books/i })).toHaveAttribute('href', '/books');
  });

  it('shows the announcement image', () => {
    render(<BooksDiscoveryNotice onDismiss={() => {}} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/images/books-discovery-notice.webp');
  });

  it('calls onDismiss when "Got it" is clicked', async () => {
    const onDismiss = jest.fn();
    render(<BooksDiscoveryNotice onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: /got it/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when "Explore Books" is clicked', async () => {
    const onDismiss = jest.fn();
    render(<BooksDiscoveryNotice onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('link', { name: /explore books/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
