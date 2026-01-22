/**
 * Tests for demo data utilities
 * Task Group 1.1: Demo data structure validation
 */
import {
  DEMO_BOOKS_PER_MONTH,
  DEMO_PAGES_PER_MONTH,
  DEMO_BOOK_FORMAT,
} from '@/lib/charts/demoData';

describe('Demo Data', () => {
  describe('DEMO_BOOKS_PER_MONTH', () => {
    test('should have 12 months of data', () => {
      expect(DEMO_BOOKS_PER_MONTH).toHaveLength(12);
    });

    test('should have correct structure with month, completed, and dnf keys', () => {
      DEMO_BOOKS_PER_MONTH.forEach((item) => {
        expect(item).toHaveProperty('month');
        expect(item).toHaveProperty('completed');
        expect(item).toHaveProperty('dnf');
        expect(typeof item.month).toBe('string');
        expect(typeof item.completed).toBe('number');
        expect(typeof item.dnf).toBe('number');
      });
    });

    test('should have completed values in realistic range (3-8 books)', () => {
      DEMO_BOOKS_PER_MONTH.forEach((item) => {
        expect(item.completed).toBeGreaterThanOrEqual(3);
        expect(item.completed).toBeLessThanOrEqual(8);
      });
    });

    test('should have dnf values in realistic range (0-2 books)', () => {
      DEMO_BOOKS_PER_MONTH.forEach((item) => {
        expect(item.dnf).toBeGreaterThanOrEqual(0);
        expect(item.dnf).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('DEMO_PAGES_PER_MONTH', () => {
    test('should have 12 months of data', () => {
      expect(DEMO_PAGES_PER_MONTH).toHaveLength(12);
    });

    test('should have correct structure with month and pages keys', () => {
      DEMO_PAGES_PER_MONTH.forEach((item) => {
        expect(item).toHaveProperty('month');
        expect(item).toHaveProperty('pages');
        expect(typeof item.month).toBe('string');
        expect(typeof item.pages).toBe('number');
      });
    });

    test('should have page values in realistic range (500-2000 pages)', () => {
      DEMO_PAGES_PER_MONTH.forEach((item) => {
        expect(item.pages).toBeGreaterThanOrEqual(500);
        expect(item.pages).toBeLessThanOrEqual(2000);
      });
    });
  });

  describe('DEMO_BOOK_FORMAT', () => {
    test('should have 4 format categories', () => {
      expect(DEMO_BOOK_FORMAT).toHaveLength(4);
    });

    test('should have correct structure with name and value keys', () => {
      DEMO_BOOK_FORMAT.forEach((item) => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('value');
        expect(typeof item.name).toBe('string');
        expect(typeof item.value).toBe('number');
      });
    });

    test('should include expected format names', () => {
      const formatNames = DEMO_BOOK_FORMAT.map((item) => item.name);
      expect(formatNames).toContain('Physical');
      expect(formatNames).toContain('Ebook');
      expect(formatNames).toContain('Audiobook');
      expect(formatNames).toContain('Graphic Novel');
    });

    test('should have format values sum to reasonable total', () => {
      const total = DEMO_BOOK_FORMAT.reduce((sum, item) => sum + item.value, 0);
      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(100);
    });
  });
});
