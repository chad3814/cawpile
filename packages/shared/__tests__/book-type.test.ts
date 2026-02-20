import { describe, it, expect } from 'vitest';
import { detectBookType } from '../src/utils/bookType.js';

describe('detectBookType', () => {
  it('returns FICTION for fiction categories', () => {
    expect(detectBookType(['Fiction'])).toBe('FICTION');
    expect(detectBookType(['Science Fiction'])).toBe('FICTION');
    expect(detectBookType(['Literary Fiction'])).toBe('FICTION');
    expect(detectBookType(['Fantasy', 'Young Adult Fiction'])).toBe('FICTION');
  });

  it('returns NONFICTION for non-fiction categories', () => {
    expect(detectBookType(['Non-fiction'])).toBe('NONFICTION');
    expect(detectBookType(['Nonfiction'])).toBe('NONFICTION');
    expect(detectBookType(['Biography & Autobiography'])).toBe('NONFICTION');
    expect(detectBookType(['History'])).toBe('NONFICTION');
    expect(detectBookType(['Science', 'Mathematics'])).toBe('NONFICTION');
    expect(detectBookType(['Self-Help'])).toBe('NONFICTION');
    expect(detectBookType(['True Crime'])).toBe('NONFICTION');
  });

  it('returns FICTION when no categories are provided', () => {
    expect(detectBookType(null)).toBe('FICTION');
    expect(detectBookType(undefined)).toBe('FICTION');
    expect(detectBookType([])).toBe('FICTION');
  });

  it('prioritizes explicit non-fiction over fiction categories', () => {
    // If both fiction and non-fiction appear, non-fiction wins
    expect(detectBookType(['Non-fiction', 'Fiction'])).toBe('NONFICTION');
  });
});
