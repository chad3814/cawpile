export interface BookDateValidationInput {
  /** yyyy-mm-dd; absent values (undefined, null, or empty string) are skipped. */
  startDate?: string | null;
  /** yyyy-mm-dd; absent values (undefined, null, or empty string) are skipped. */
  finishDate?: string | null;
  /** yyyy-mm-dd; defaults to the current UTC date. */
  today?: string;
}

/**
 * Validates a book's start/finish date pair. Returns an error message, or
 * null when the pair is valid.
 */
export function validateBookDates(input: BookDateValidationInput): string | null {
  // toISOString() always returns a UTC timestamp, so split('T')[0] is the UTC date.
  const today = input.today ?? new Date().toISOString().split('T')[0];
  const startDate = input.startDate || null;
  const finishDate = input.finishDate || null;

  if (startDate && startDate > today) {
    return 'Start date cannot be in the future';
  }
  if (finishDate && finishDate > today) {
    return 'Finish date cannot be in the future';
  }
  if (startDate && finishDate && finishDate < startDate) {
    return 'Finish date cannot be before the start date';
  }
  return null;
}

/**
 * Validates that a status carries the date it implies. A status's required
 * date is rejected only when it is explicitly cleared (`null`); an absent
 * (`undefined`) date is left to the caller to default. Returns an error
 * message, or null when valid.
 *
 * - COMPLETED / DNF require a finish ("stopped reading") date.
 * - READING requires a start date.
 * - WANT_TO_READ requires neither.
 */
export function validateStatusDates(
  status: string | null | undefined,
  startDate: string | null | undefined,
  finishDate: string | null | undefined,
): string | null {
  if (status === 'COMPLETED' && finishDate === null) {
    return 'A finish date is required for completed books';
  }
  if (status === 'DNF' && finishDate === null) {
    return 'A stopped-reading date is required for books you did not finish';
  }
  if (status === 'READING' && startDate === null) {
    return 'A start date is required for books you are reading';
  }
  return null;
}
