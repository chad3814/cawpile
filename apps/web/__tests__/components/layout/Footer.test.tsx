/**
 * Tests for Footer component
 * Task Group 2.1: Footer component tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '@/components/layout/Footer';

describe('Footer', () => {
  test('should render without errors', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  test('should render About link with correct href', () => {
    render(<Footer />);

    const aboutLink = screen.getByRole('link', { name: /about/i });
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  test('should have proper styling classes for consistent design', () => {
    render(<Footer />);

    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('bg-background');
    expect(footer).toHaveClass('border-t');
    expect(footer).toHaveClass('border-border');
  });

  test('should render link with hover styling classes', () => {
    render(<Footer />);

    const aboutLink = screen.getByRole('link', { name: /about/i });
    expect(aboutLink).toHaveClass('text-muted-foreground');
    expect(aboutLink).toHaveClass('hover:text-foreground');
  });
});
