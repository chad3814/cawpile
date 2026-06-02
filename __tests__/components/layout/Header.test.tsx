import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/layout/Header';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ status: 'unauthenticated' }),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));
// The modals are heavy; stub them out for this nav-focused test.
jest.mock('@/components/modals/BookSearchModal', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/modals/AddBookWizard', () => ({
  __esModule: true,
  default: () => null,
}));

describe('Header', () => {
  it('shows a Browse link to /books', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: /browse/i });
    expect(link).toHaveAttribute('href', '/books');
  });
});
