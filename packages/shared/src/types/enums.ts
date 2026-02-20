/**
 * Standalone string union types replacing @prisma/client enum imports.
 * These are used across web and mobile apps without requiring Prisma.
 */

export type BookStatus = 'WANT_TO_READ' | 'READING' | 'COMPLETED' | 'DNF';

export type BookFormat = 'HARDCOVER' | 'PAPERBACK' | 'EBOOK' | 'AUDIOBOOK';

export type BookType = 'FICTION' | 'NONFICTION';

export type DashboardLayout = 'GRID' | 'TABLE';

export type LibrarySortBy = 'endDate' | 'startDate' | 'title' | 'dateAdded';

export type LibrarySortOrder = 'asc' | 'desc';
