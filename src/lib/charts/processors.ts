interface MonthlyData {
  month: string;
  value: number;
}

interface PieData {
  name: string;
  value: number;
}

/**
 * Process monthly data and trim trailing zero months
 */
export function processMonthlyData(data: MonthlyData[]): MonthlyData[] {
  if (!data || data.length === 0) return [];

  // Find the last non-zero month
  let lastNonZeroIndex = data.length - 1;
  while (lastNonZeroIndex >= 0 && data[lastNonZeroIndex].value === 0) {
    lastNonZeroIndex--;
  }

  // Return data up to and including the last non-zero month
  // But always show at least January
  return data.slice(0, Math.max(1, lastNonZeroIndex + 1));
}

/**
 * Aggregate pie chart data with top N items and "Other" category
 */
export function aggregatePieData(
  data: PieData[],
  maxSegments: number = 7
): PieData[] {
  if (!data || data.length === 0) return [];

  // Sort by value descending
  const sorted = [...data].sort((a, b) => b.value - a.value);

  if (sorted.length <= maxSegments) {
    return sorted;
  }

  // Take top N-1 items and aggregate the rest as "Other"
  const topItems = sorted.slice(0, maxSegments);
  const otherItems = sorted.slice(maxSegments);

  if (otherItems.length > 0) {
    const otherValue = otherItems.reduce((sum, item) => sum + item.value, 0);
    topItems.push({
      name: 'Other',
      value: otherValue
    });
  }

  return topItems;
}

/**
 * Filter data by date range (year)
 */
export function filterByDateRange<T extends { date: Date | string }>(
  data: T[],
  year: number
): T[] {
  return data.filter(item => {
    const date = item.date instanceof Date ? item.date : new Date(item.date);
    return date.getFullYear() === year;
  });
}

/**
 * Get month name from month number (0-indexed)
 */
export function getMonthName(monthIndex: number): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return months[monthIndex] || '';
}

/**
 * Create empty monthly data for a year up to current month
 */
export function createEmptyMonthlyData(year: number): MonthlyData[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const maxMonth = year === currentYear ? currentDate.getMonth() : 11;

  const data: MonthlyData[] = [];
  for (let i = 0; i <= maxMonth; i++) {
    data.push({
      month: getMonthName(i),
      value: 0
    });
  }

  return data;
}