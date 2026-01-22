/**
 * Tests for HomepageCharts component
 * Task Group 4.1: Homepage demo charts tests
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomepageCharts from '@/components/homepage/HomepageCharts';

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

describe('HomepageCharts', () => {
  test('should render three chart containers', () => {
    render(<HomepageCharts />);

    expect(screen.getByText('Books per Month')).toBeInTheDocument();
    expect(screen.getByText('Book Format')).toBeInTheDocument();
    expect(screen.getByText('Pages per Month')).toBeInTheDocument();
  });

  test('should render charts with responsive containers', () => {
    render(<HomepageCharts />);

    const responsiveContainers = screen.getAllByTestId('responsive-container');
    expect(responsiveContainers).toHaveLength(3);
  });

  test('should render bar charts and pie chart', () => {
    render(<HomepageCharts />);

    const barCharts = screen.getAllByTestId('bar-chart');
    const pieCharts = screen.getAllByTestId('pie-chart');

    expect(barCharts).toHaveLength(2);
    expect(pieCharts).toHaveLength(1);
  });

  test('should have chart containers with proper styling', () => {
    render(<HomepageCharts />);

    const chartTitles = [
      screen.getByText('Books per Month'),
      screen.getByText('Book Format'),
      screen.getByText('Pages per Month'),
    ];

    chartTitles.forEach((title) => {
      const container = title.closest('div.rounded-lg');
      expect(container).toHaveClass('border');
      expect(container).toHaveClass('border-border');
      expect(container).toHaveClass('bg-background');
    });
  });
});
