import { formatBookStat } from '@/lib/books/formatBookStat';

describe('formatBookStat', () => {
  it('formats an addedAt stat as "Added Mon YYYY" (UTC)', () => {
    expect(formatBookStat({ kind: 'addedAt', value: '2026-05-01T00:00:00Z' })).toBe('Added May 2026');
  });

  it('pluralizes readers', () => {
    expect(formatBookStat({ kind: 'readers', value: 42 })).toBe('42 readers');
    expect(formatBookStat({ kind: 'readers', value: 1 })).toBe('1 reader');
  });

  it('formats a rating to one decimal with "avg"', () => {
    expect(formatBookStat({ kind: 'rating', value: 8.37 })).toBe('8.4 avg');
  });

  it('uses the instant\'s UTC month near a month boundary', () => {
    // 2026-05-31T23:30Z is still May in UTC; if timeZone:'UTC' were dropped, a
    // positive-offset test runner would render June and this would fail.
    expect(formatBookStat({ kind: 'addedAt', value: '2026-05-31T23:30:00Z' })).toBe('Added May 2026');
  });
});
