---
name: Prisma Queries
description: Standards for Prisma database queries. Use when writing database queries, implementing filtering/pagination, optimizing query performance, or handling transactions.
---

# Prisma Queries

## When to use this skill:
- Writing Prisma queries in API routes or lib functions
- Implementing search, filter, and pagination
- Optimizing database queries for performance
- Using transactions for related operations
- Aggregating data for analytics

## Basic CRUD Operations

```typescript
// Create
const userBook = await prisma.userBook.create({
  data: {
    userId,
    editionId,
    status: "READING",
    startDate: new Date(),
  },
});

// Read single
const book = await prisma.userBook.findUnique({
  where: { id },
});

// Read with unique composite key
const existing = await prisma.userBook.findUnique({
  where: { userId_editionId: { userId, editionId } },
});

// Read many with filter
const books = await prisma.userBook.findMany({
  where: { userId, status: "READING" },
  orderBy: { updatedAt: "desc" },
});

// Update
const updated = await prisma.userBook.update({
  where: { id },
  data: { currentPage: 150 },
});

// Delete
await prisma.userBook.delete({
  where: { id },
});
```

## Filtering Patterns

```typescript
// Multiple conditions (AND)
const books = await prisma.userBook.findMany({
  where: {
    userId,
    status: "COMPLETED",
    endDate: { gte: startOfYear, lte: endOfYear },
  },
});

// OR conditions
const editions = await prisma.edition.findFirst({
  where: {
    OR: [
      { isbn13: isbn },
      { isbn10: isbn },
      { googleBookId },
    ],
  },
});

// NOT conditions
const unfinished = await prisma.userBook.findMany({
  where: {
    userId,
    NOT: { status: "COMPLETED" },
  },
});

// Contains (case-insensitive search)
const books = await prisma.book.findMany({
  where: {
    title: { contains: searchTerm, mode: "insensitive" },
  },
});
```

## Pagination

```typescript
const page = parseInt(searchParams.get("page") || "1");
const limit = parseInt(searchParams.get("limit") || "20");
const skip = (page - 1) * limit;

const [books, total] = await Promise.all([
  prisma.userBook.findMany({
    where: { userId },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  }),
  prisma.userBook.count({ where: { userId } }),
]);

return NextResponse.json({
  data: books,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});
```

## Aggregations

```typescript
// Count by status
const statusCounts = await prisma.userBook.groupBy({
  by: ["status"],
  where: { userId },
  _count: { id: true },
});

// Sum pages read
const totalPages = await prisma.userBook.aggregate({
  where: { userId, status: "COMPLETED" },
  _sum: { pageCount: true },
});

// Average rating
const avgRating = await prisma.cawpileRating.aggregate({
  where: { userBook: { userId } },
  _avg: { average: true },
});
```

## Transactions

```typescript
// Sequential operations that must succeed together
const result = await prisma.$transaction(async (tx) => {
  const book = await tx.book.upsert({
    where: { title_authors: { title, authors } },
    create: { title, authors },
    update: {},
  });

  const edition = await tx.edition.create({
    data: { bookId: book.id, isbn13 },
  });

  const userBook = await tx.userBook.create({
    data: { userId, editionId: edition.id, status: "WANT_TO_READ" },
  });

  return userBook;
});
```

## Include vs Select

```typescript
// Include: fetch related records (returns full objects)
const userBook = await prisma.userBook.findUnique({
  where: { id },
  include: {
    edition: { include: { book: true } },
    rating: true,
  },
});

// Select: fetch specific fields only (more efficient)
const summary = await prisma.userBook.findMany({
  where: { userId },
  select: {
    id: true,
    status: true,
    edition: {
      select: {
        coverImage: true,
        book: { select: { title: true } },
      },
    },
  },
});
```

## Query Performance Tips

1. Add `@@index` for frequently filtered fields
2. Use `select` instead of `include` when you don't need all fields
3. Avoid N+1 queries - use `include` to fetch relations in one query
4. Use `findFirst` instead of `findMany()[0]` when you only need one result
5. Batch operations with `createMany`, `updateMany`, `deleteMany`
