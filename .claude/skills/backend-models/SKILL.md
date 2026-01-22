---
name: Prisma Models
description: Standards for Prisma model design and database utilities. Use when designing data models, creating database helper functions in src/lib/db/, or working with the dual-level Book/Edition storage pattern.
---

# Prisma Models

## When to use this skill:
- Designing new Prisma models in `prisma/schema.prisma`
- Creating database utility functions in `src/lib/db/`
- Working with Book/Edition/UserBook relationships
- Implementing findOrCreate patterns
- Querying with relations and includes

## Model Design Standards

```prisma
model ExampleModel {
  // Primary key - use cuid() for distributed systems
  id        String   @id @default(cuid())

  // Timestamps - always include
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Required fields first
  name      String
  status    Status   @default(ACTIVE)

  // Optional fields
  description String?

  // Foreign keys and relations last
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Indexes for query performance
  @@index([userId])
  @@index([status])
}
```

## Dual-Level Book Storage Pattern

```prisma
// Level 1: Deduplicated book identity
model Book {
  id      String    @id @default(cuid())
  title   String
  authors String
  editions Edition[]

  @@unique([title, authors])  // Prevents duplicate books
}

// Level 2: Edition-specific metadata
model Edition {
  id           String      @id @default(cuid())
  isbn10       String?     @unique
  isbn13       String?     @unique
  googleBookId String?     @unique
  pageCount    Int?
  coverImage   String?

  bookId       String
  book         Book        @relation(fields: [bookId], references: [id])
  userBooks    UserBook[]
  googleBook   GoogleBook?

  @@index([bookId])
}
```

## Database Utility Functions

```typescript
// src/lib/db/book.ts
import { prisma } from "@/lib/prisma";

export async function findOrCreateBook(title: string, authors: string) {
  return prisma.book.upsert({
    where: { title_authors: { title, authors } },
    create: { title, authors },
    update: {},
  });
}

export async function findOrCreateEdition(
  bookId: string,
  isbn: string | null,
  googleBookId: string | null
) {
  // Check for existing edition by ISBN or Google ID
  const existing = await prisma.edition.findFirst({
    where: {
      OR: [
        isbn ? { isbn13: isbn } : {},
        isbn ? { isbn10: isbn } : {},
        googleBookId ? { googleBookId } : {},
      ].filter(c => Object.keys(c).length > 0),
    },
  });

  if (existing) return existing;

  return prisma.edition.create({
    data: {
      bookId,
      isbn13: isbn?.length === 13 ? isbn : null,
      isbn10: isbn?.length === 10 ? isbn : null,
      googleBookId,
    },
  });
}
```

## Query Patterns with Relations

```typescript
// Include related data
const userBook = await prisma.userBook.findUnique({
  where: { id },
  include: {
    edition: {
      include: {
        book: true,
        googleBook: true,
      },
    },
    rating: true,
    readingSessions: true,
  },
});

// Select specific fields
const books = await prisma.userBook.findMany({
  where: { userId },
  select: {
    id: true,
    status: true,
    edition: {
      select: {
        coverImage: true,
        book: { select: { title: true, authors: true } },
      },
    },
  },
});
```

## Enum Definitions

```prisma
enum ReadingStatus {
  WANT_TO_READ
  READING
  COMPLETED
  DNF
}

enum BookFormat {
  PHYSICAL
  EBOOK
  AUDIOBOOK
  GRAPHIC_NOVEL
}

enum BookType {
  FICTION
  NON_FICTION
}
```

## Singleton Prisma Client

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```
