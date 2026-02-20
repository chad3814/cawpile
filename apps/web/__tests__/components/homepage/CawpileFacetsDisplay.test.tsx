/**
 * Tests for CawpileFacetsDisplay component
 * Task Group 3.1: CAWPILE facets display tests
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CawpileFacetsDisplay from '@/components/homepage/CawpileFacetsDisplay';

describe('CawpileFacetsDisplay', () => {
  test('should render Fiction facets by default with all 7 facet names', () => {
    render(<CawpileFacetsDisplay />);

    // Check Fiction facet names
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Atmosphere')).toBeInTheDocument();
    expect(screen.getByText('Writing')).toBeInTheDocument();
    expect(screen.getByText('Plot')).toBeInTheDocument();
    expect(screen.getByText('Intrigue')).toBeInTheDocument();
    expect(screen.getByText('Logic')).toBeInTheDocument();
    expect(screen.getByText('Enjoyment')).toBeInTheDocument();
  });

  test('should render Non-Fiction facets when toggled', () => {
    render(<CawpileFacetsDisplay />);

    // Click Non-Fiction toggle
    const nonFictionButton = screen.getByRole('button', { name: /non-fiction/i });
    fireEvent.click(nonFictionButton);

    // Check Non-Fiction facet names
    expect(screen.getByText('Credibility/Research')).toBeInTheDocument();
    expect(screen.getByText('Authenticity/Uniqueness')).toBeInTheDocument();
    expect(screen.getByText('Writing')).toBeInTheDocument();
    expect(screen.getByText('Personal Impact')).toBeInTheDocument();
    expect(screen.getByText('Intrigue')).toBeInTheDocument();
    expect(screen.getByText('Logic/Informativeness')).toBeInTheDocument();
    expect(screen.getByText('Enjoyment')).toBeInTheDocument();
  });

  test('should display rating scale guide with all 10 values', () => {
    render(<CawpileFacetsDisplay />);

    // Check for rating scale heading
    expect(screen.getByText('Rating Scale Guide')).toBeInTheDocument();

    // Check for all 10 rating values
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(i.toString())).toBeInTheDocument();
    }
  });

  test('should display rating scale labels', () => {
    render(<CawpileFacetsDisplay />);

    // Check for specific rating labels
    expect(screen.getByText('One of my favourites ever')).toBeInTheDocument();
    expect(screen.getByText('Mediocre. Equal good and bad')).toBeInTheDocument();
    expect(screen.getByText("Abysmal. Shouldn't have been published")).toBeInTheDocument();
  });

  test('should toggle between Fiction and Non-Fiction', () => {
    render(<CawpileFacetsDisplay />);

    // Initially shows Fiction
    expect(screen.getByText('Characters')).toBeInTheDocument();

    // Toggle to Non-Fiction
    fireEvent.click(screen.getByRole('button', { name: /non-fiction/i }));
    expect(screen.getByText('Credibility/Research')).toBeInTheDocument();
    expect(screen.queryByText('Characters')).not.toBeInTheDocument();

    // Toggle back to Fiction
    fireEvent.click(screen.getByRole('button', { name: /^fiction$/i }));
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.queryByText('Credibility/Research')).not.toBeInTheDocument();
  });
});
