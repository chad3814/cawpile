import { validateBookDates } from '@/lib/validateBookDates';

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
