import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SidebarNavigation from '@/components/dashboard/SidebarNavigation';

jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

function renderNav(onSectionChange = jest.fn()) {
  render(
    <SidebarNavigation
      activeSection="library"
      activeAnchor={null}
      onSectionChange={onSectionChange}
      isOpen={false}
      onClose={jest.fn()}
    />
  );
  return onSectionChange;
}

describe('SidebarNavigation', () => {
  test('"Books" is a link to /books, not a section button', () => {
    renderNav();
    const booksLink = screen.getByRole('link', { name: 'Books' });
    expect(booksLink).toHaveAttribute('href', '/books');
  });

  test('clicking "Books" does not switch dashboard sections', () => {
    const onSectionChange = renderNav();
    fireEvent.click(screen.getByRole('link', { name: 'Books' }));
    expect(onSectionChange).not.toHaveBeenCalled();
  });

  test('section items remain buttons that switch sections', () => {
    const onSectionChange = renderNav();
    const authorsButton = screen.getByRole('button', { name: 'Authors' });
    fireEvent.click(authorsButton);
    expect(onSectionChange).toHaveBeenCalledWith('authors');
  });
});
