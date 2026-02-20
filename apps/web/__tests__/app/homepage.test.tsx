/**
 * Tests for enhanced homepage
 * Task Group 6.1: Homepage enhancement tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/page';

// Mock Recharts components as they don't render well in JSDOM
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Bar: () => <div data-testid="bar" />,
    Pie: () => <div data-testid="pie" />,
    Cell: () => <div data-testid="cell" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
  };
});

describe('Homepage', () => {
  test('should render CAWPILE explanation section', () => {
    render(<Home />);

    expect(screen.getByText('The CAWPILE Rating System')).toBeInTheDocument();
    expect(
      screen.getByText(/Rate books using 7 key facets/i)
    ).toBeInTheDocument();
  });

  test('should render demo charts section below CAWPILE explanation', () => {
    render(<Home />);

    expect(screen.getByText('Track Your Reading Statistics')).toBeInTheDocument();
    expect(screen.getByText('Books per Month')).toBeInTheDocument();
    expect(screen.getByText('Book Format')).toBeInTheDocument();
    expect(screen.getByText('Pages per Month')).toBeInTheDocument();
  });

  test('should render existing features grid', () => {
    render(<Home />);

    expect(screen.getByText('Track Reading')).toBeInTheDocument();
    expect(screen.getByText('Set Goals')).toBeInTheDocument();
    expect(screen.getByText('Discover Books')).toBeInTheDocument();
  });

  test('should render hero section with call to action', () => {
    render(<Home />);

    expect(screen.getByText('Track Your Reading Journey')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start tracking/i })).toBeInTheDocument();
  });

  test('should render CAWPILE facets display component', () => {
    render(<Home />);

    // Check for Fiction/Non-Fiction toggle buttons
    expect(screen.getByRole('button', { name: /^fiction$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /non-fiction/i })).toBeInTheDocument();

    // Check for facet names
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Writing')).toBeInTheDocument();
    expect(screen.getByText('Enjoyment')).toBeInTheDocument();
  });
});
