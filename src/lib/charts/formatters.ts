/**
 * Format month for display
 */
export function formatMonth(month: string): string {
  return month;
}

/**
 * Format number for display with thousand separators
 */
export function formatNumber(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
}

/**
 * Format book count for tooltips
 */
export function formatBookCount(count: number): string {
  return `${count} ${count === 1 ? 'book' : 'books'}`;
}

/**
 * Format page count for display
 */
export function formatPageCount(pages: number): string {
  if (pages >= 1000) {
    return `${(pages / 1000).toFixed(1)}k pages`;
  }
  return `${pages} pages`;
}

/**
 * Format hours for display
 */
export function formatHours(hours: number): string {
  if (hours >= 100) {
    return hours.toFixed(0) + ' hrs';
  }
  return hours.toFixed(1) + ' hrs';
}

/**
 * Format book format for display
 */
export function formatBookFormat(format: string): string {
  const formats: Record<string, string> = {
    HARDCOVER: 'Hardcover',
    PAPERBACK: 'Paperback',
    EBOOK: 'E-book',
    AUDIOBOOK: 'Audiobook'
  };
  return formats[format] || format;
}