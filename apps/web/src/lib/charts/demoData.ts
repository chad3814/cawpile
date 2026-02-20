/**
 * Demo data for homepage example charts
 * Static data used to showcase chart functionality without requiring authentication
 */

export interface DemoBooksPerMonthData {
  month: string;
  completed: number;
  dnf: number;
}

export interface DemoPagesPerMonthData {
  month: string;
  pages: number;
}

export interface DemoBookFormatData {
  name: string;
  value: number;
}

/**
 * Demo data for Books per Month chart
 * Shows 12 months with varied completed/DNF counts
 */
export const DEMO_BOOKS_PER_MONTH: DemoBooksPerMonthData[] = [
  { month: 'Jan', completed: 4, dnf: 1 },
  { month: 'Feb', completed: 3, dnf: 0 },
  { month: 'Mar', completed: 6, dnf: 1 },
  { month: 'Apr', completed: 5, dnf: 0 },
  { month: 'May', completed: 7, dnf: 2 },
  { month: 'Jun', completed: 4, dnf: 1 },
  { month: 'Jul', completed: 8, dnf: 1 },
  { month: 'Aug', completed: 6, dnf: 0 },
  { month: 'Sep', completed: 5, dnf: 1 },
  { month: 'Oct', completed: 7, dnf: 2 },
  { month: 'Nov', completed: 4, dnf: 0 },
  { month: 'Dec', completed: 5, dnf: 1 },
];

/**
 * Demo data for Pages per Month chart
 * Shows 12 months with varied page counts (500-2000 range)
 */
export const DEMO_PAGES_PER_MONTH: DemoPagesPerMonthData[] = [
  { month: 'Jan', pages: 1200 },
  { month: 'Feb', pages: 950 },
  { month: 'Mar', pages: 1650 },
  { month: 'Apr', pages: 1400 },
  { month: 'May', pages: 1850 },
  { month: 'Jun', pages: 1100 },
  { month: 'Jul', pages: 2000 },
  { month: 'Aug', pages: 1500 },
  { month: 'Sep', pages: 1300 },
  { month: 'Oct', pages: 1750 },
  { month: 'Nov', pages: 1050 },
  { month: 'Dec', pages: 1350 },
];

/**
 * Demo data for Book Format pie chart
 * Distribution across Physical, Ebook, Audiobook, Double Dorking
 */
export const DEMO_BOOK_FORMAT: DemoBookFormatData[] = [
  { name: 'Physical', value: 28 },
  { name: 'Ebook', value: 22 },
  { name: 'Audiobook', value: 12 },
  { name: 'Double Dorking', value: 6 },
];
