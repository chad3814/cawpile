import { validateBookDates, validateStatusDates } from '@/lib/validateBookDates';

describe('validateBookDates', () => {
  const today = '2026-06-02';

  test('returns null when both dates are absent', () => {
    expect(validateBookDates({ today })).toBeNull();
  });

  test('returns null for a valid start/finish pair', () => {
    expect(
      validateBookDates({ startDate: '2026-01-01', finishDate: '2026-02-01', today })
    ).toBeNull();
  });

  test('allows finish equal to start', () => {
    expect(
      validateBookDates({ startDate: '2026-01-01', finishDate: '2026-01-01', today })
    ).toBeNull();
  });

  test('rejects finish before start', () => {
    expect(
      validateBookDates({ startDate: '2026-02-01', finishDate: '2026-01-01', today })
    ).toBe('Finish date cannot be before the start date');
  });

  test('rejects a future start date', () => {
    expect(validateBookDates({ startDate: '2026-06-03', today })).toBe(
      'Start date cannot be in the future'
    );
  });

  test('rejects a future finish date', () => {
    expect(validateBookDates({ finishDate: '2026-06-03', today })).toBe(
      'Finish date cannot be in the future'
    );
  });

  test('treats null and undefined as absent', () => {
    expect(validateBookDates({ startDate: null, finishDate: null, today })).toBeNull();
  });

  test('ordering check is skipped when only one date is present', () => {
    expect(validateBookDates({ finishDate: '2026-01-01', today })).toBeNull();
    expect(validateBookDates({ startDate: '2026-01-01', today })).toBeNull();
  });

  test('treats empty-string dates as absent', () => {
    expect(validateBookDates({ startDate: '', finishDate: '', today })).toBeNull();
  });

  test('accepts a start date equal to today', () => {
    expect(validateBookDates({ startDate: today, today })).toBeNull();
  });

  test('accepts a finish date equal to today', () => {
    expect(validateBookDates({ finishDate: today, today })).toBeNull();
  });
});

describe('validateStatusDates', () => {
  test('COMPLETED with an explicit null finish date is rejected', () => {
    expect(validateStatusDates('COMPLETED', '2026-01-01', null)).toBe(
      'A finish date is required for completed books'
    );
  });

  test('DNF with an explicit null finish date is rejected', () => {
    expect(validateStatusDates('DNF', '2026-01-01', null)).toBe(
      'A stopped-reading date is required for books you did not finish'
    );
  });

  test('READING with an explicit null start date is rejected', () => {
    expect(validateStatusDates('READING', null, null)).toBe(
      'A start date is required for books you are reading'
    );
  });

  test('an absent (undefined) date is allowed — caller defaults it', () => {
    expect(validateStatusDates('COMPLETED', undefined, undefined)).toBeNull();
    expect(validateStatusDates('READING', undefined, undefined)).toBeNull();
    expect(validateStatusDates('DNF', undefined, undefined)).toBeNull();
  });

  test('a provided date satisfies the requirement', () => {
    expect(validateStatusDates('COMPLETED', '2026-01-01', '2026-02-01')).toBeNull();
    expect(validateStatusDates('READING', '2026-01-01', null)).toBeNull();
  });

  test('WANT_TO_READ requires neither date', () => {
    expect(validateStatusDates('WANT_TO_READ', null, null)).toBeNull();
  });

  test('a status does not require the date it does not own', () => {
    // READING needs a start date, not a finish date.
    expect(validateStatusDates('READING', '2026-01-01', null)).toBeNull();
    // COMPLETED needs a finish date, not a start date.
    expect(validateStatusDates('COMPLETED', null, '2026-02-01')).toBeNull();
  });
});
