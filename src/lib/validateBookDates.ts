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
