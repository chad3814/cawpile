---
name: TypeScript Coding Style
description: TypeScript and React coding standards for this codebase. Use when writing any TypeScript/TSX code, naming variables/functions, or structuring imports.
---

# TypeScript Coding Style

## When to use this skill:
- Writing new TypeScript/TSX files
- Naming variables, functions, and types
- Structuring imports and exports
- Following consistent code patterns

## Naming Conventions

```typescript
// Variables and functions: camelCase
const userBook = await getUserBook(id);
function calculateAverageRating(ratings: number[]): number { }

// Types and interfaces: PascalCase
interface UserBookProps { }
type ReadingStatus = "READING" | "COMPLETED";

// Constants: SCREAMING_SNAKE_CASE for true constants only
const MAX_BOOKS_PER_PAGE = 20;
const API_TIMEOUT_MS = 5000;

// Booleans: prefix with is/has/should/can
const isLoading = true;
const hasRating = book.rating !== null;
const shouldShowModal = isOpen && !isLoading;
const canEdit = user.id === book.userId;

// Event handlers: prefix with handle or on
function handleSubmit(e: React.FormEvent) { }
function onStatusChange(status: string) { }
```

## Import Organization

```typescript
// 1. React/Next.js imports
import { useState, useEffect } from "react";
import { NextRequest, NextResponse } from "next/server";

// 2. Third-party libraries
import { Dialog } from "@headlessui/react";
import { PlusIcon } from "@heroicons/react/24/outline";

// 3. Internal absolute imports (@/)
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-helpers";
import type { UserBook } from "@/types/book";

// 4. Relative imports (if needed)
import { BookCard } from "./BookCard";
```

## Type Definitions

```typescript
// Use interface for object shapes
interface BookCardProps {
  book: UserBook;
  onEdit?: (id: string) => void;
}

// Use type for unions, intersections, primitives
type ReadingStatus = "WANT_TO_READ" | "READING" | "COMPLETED" | "DNF";
type BookWithRating = UserBook & { rating: CawpileRating };

// Prefer explicit return types for functions
function getBookStatus(book: UserBook): ReadingStatus {
  return book.status;
}

// Use 'type' imports when only importing types
import type { UserBook, Edition } from "@/types/book";
```

## Function Patterns

```typescript
// Async functions with clear error handling
async function fetchUserBooks(userId: string): Promise<UserBook[]> {
  const books = await prisma.userBook.findMany({
    where: { userId },
    include: { edition: { include: { book: true } } },
  });
  return books;
}

// Arrow functions for callbacks and simple operations
const sortedBooks = books.sort((a, b) =>
  a.edition.book.title.localeCompare(b.edition.book.title)
);

// Destructure props in function signature
function BookCard({ book, onEdit }: BookCardProps) {
  return <div>{book.edition.book.title}</div>;
}
```

## Avoid

```typescript
// Never use 'any'
// Bad:
function processData(data: any) { }

// Good:
function processData(data: unknown) { }

// Better
function processData(data: BookData) { }

// Avoid non-null assertions when possible
// Bad:
const title = book.edition!.book!.title;

// Good:
const title = book.edition?.book?.title ?? "Unknown";

// Avoid complex nested ternaries
// Bad:
const status = isLoading ? "Loading" : hasError ? "Error" : data ? "Success" : "Empty";

// Good:
function getStatus() {
  if (isLoading) return "Loading";
  if (hasError) return "Error";
  if (data) return "Success";
  return "Empty";
}
```

## File Structure

```typescript
// Component file structure
"use client";  // If needed

// Imports (organized as above)
import { useState } from "react";
import type { UserBook } from "@/types/book";

// Types/interfaces
interface Props {
  book: UserBook;
}

// Component
export function BookCard({ book }: Props) {
  // Hooks first
  const [isExpanded, setIsExpanded] = useState(false);

  // Derived values
  const title = book.edition.book.title;

  // Event handlers
  function handleClick() {
    setIsExpanded(!isExpanded);
  }

  // Render
  return (
    <div onClick={handleClick}>
      {title}
    </div>
  );
}
```
