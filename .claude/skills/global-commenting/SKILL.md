---
name: Code Comments
description: Standards for when and how to write code comments. Use when deciding whether to add comments to complex logic or documenting non-obvious behavior.
---

# Code Comments

## When to use this skill:
- Deciding whether code needs comments
- Documenting complex business logic
- Explaining non-obvious implementation decisions
- Writing JSDoc for exported functions

## When to Comment

Comment only when the code cannot explain itself:

```typescript
// Good: Explains WHY, not WHAT
// Google Books API returns dates in various formats (YYYY, YYYY-MM, YYYY-MM-DD)
// We normalize to full ISO date for consistent storage
function normalizePublishDate(date: string): string {
  if (date.length === 4) return `${date}-01-01`;
  if (date.length === 7) return `${date}-01`;
  return date;
}

// Bad: Obvious from the code
// Get the user's books
const books = await getUserBooks(userId);

// Bad: Should be a better variable name instead
// The number of books
const n = books.length;

// Good: Better variable name, no comment needed
const bookCount = books.length;
```

## Comment Patterns

```typescript
// Single-line for brief explanations
// Neon serverless requires connection pooling to prevent exhaustion
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Multi-line for complex logic
/**
 * Merges search results from multiple providers, deduplicating by ISBN
 * or fuzzy title/author matching. Results are ranked by provider weight
 * (local database highest) then sorted by relevance score.
 */
function mergeSearchResults(results: ProviderResult[]): SearchResult[] {
  // Implementation
}

// TODO comments with context
// TODO(#123): Add rate limiting when we exceed Google Books quota
// TODO: Remove after migration to new auth system (Q2 2025)
```

## JSDoc for Exported Functions

```typescript
/**
 * Creates or retrieves a book record, preventing duplicates.
 * Books are deduplicated by exact title + authors match.
 *
 * @param title - The book's full title
 * @param authors - Comma-separated author names
 * @returns The existing or newly created book
 */
export async function findOrCreateBook(
  title: string,
  authors: string
): Promise<Book> {
  return prisma.book.upsert({
    where: { title_authors: { title, authors } },
    create: { title, authors },
    update: {},
  });
}
```

## Don't Comment

```typescript
// Avoid: Commented-out code (delete it, git has history)
// const oldImplementation = () => { ... };

// Avoid: Redundant type comments
// userId is a string
const userId: string = session.user.id;

// Avoid: Change logs (use git commits)
// Changed on 2024-01-15 by John to fix bug

// Avoid: Explaining bad code (refactor instead)
// This is hacky but it works
const x = JSON.parse(JSON.stringify(data));
```

## Section Comments

```typescript
// Use sparingly to divide large files
// ============================================
// CRUD Operations
// ============================================

export async function createBook() { }
export async function getBook() { }
export async function updateBook() { }
export async function deleteBook() { }

// ============================================
// Search Operations
// ============================================

export async function searchBooks() { }
```
