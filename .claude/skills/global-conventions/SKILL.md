---
name: Project Conventions
description: Project-specific conventions for file organization, naming, and patterns. Use when creating new files, organizing code, or following established patterns.
---

# Project Conventions

## When to use this skill:
- Creating new files or directories
- Following established naming patterns
- Using project-specific utilities
- Organizing imports and exports

## File Naming

```
# Components: PascalCase
src/components/book/BookCard.tsx
src/components/modals/AddBookWizard.tsx

# Pages/Routes: lowercase with hyphens (App Router convention)
src/app/dashboard/page.tsx
src/app/api/user/books/route.ts

# Utilities: camelCase
src/lib/auth-helpers.ts
src/lib/googleBooks.ts

# Types: camelCase with descriptive names
src/types/book.ts
src/types/cawpile.ts

# Hooks: camelCase with 'use' prefix
src/hooks/useBookSearch.ts
src/hooks/useDebounce.ts
```

## Directory Structure Conventions

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API routes (RESTful structure)
│   │   └── [resource]/
│   │       ├── route.ts          # Collection: GET (list), POST (create)
│   │       └── [id]/route.ts     # Item: GET, PATCH, DELETE
│   └── [page]/page.tsx
│
├── components/       # Organized by feature/domain
│   ├── [feature]/    # Feature-specific components
│   ├── modals/       # All modal dialogs
│   ├── forms/        # Reusable form fields
│   └── layout/       # Global layout components
│
├── lib/              # Business logic and utilities
│   ├── db/           # Database utilities (findOrCreate, etc.)
│   ├── search/       # Search system (providers, orchestrator)
│   ├── auth/         # Auth utilities beyond NextAuth config
│   └── [utility].ts  # Standalone utilities
│
├── types/            # TypeScript type definitions
├── hooks/            # Custom React hooks
└── contexts/         # React Context providers
```

## Import Alias

Always use `@/` for src directory imports:

```typescript
// Good
import { prisma } from "@/lib/prisma";
import { BookCard } from "@/components/book/BookCard";
import type { UserBook } from "@/types/book";

// Avoid relative paths for distant files
import { prisma } from "../../../lib/prisma";  // Bad
```

## API Route Conventions

```
/api/user/books         GET (list), POST (create)
/api/user/books/[id]    GET, PATCH, DELETE
/api/books/search       GET (with query params)
/api/charts/[chartName] GET (with year param)
/api/admin/[resource]   Admin-only endpoints
```

## Component Export Pattern

```typescript
// Named exports for components (not default)
// Good
export function BookCard({ book }: BookCardProps) { }

// Avoid
export default function BookCard() { }

// Exception: page.tsx files use default export (Next.js requirement)
export default function DashboardPage() { }
```

## Environment Variables

```typescript
// Access via process.env
const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

// For client-side, prefix with NEXT_PUBLIC_
const publicUrl = process.env.NEXT_PUBLIC_APP_URL;

// Type-safe access pattern
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}
```

## Database Utilities Pattern

```typescript
// Always use utility functions from src/lib/db/
import { findOrCreateBook, findOrCreateEdition } from "@/lib/db/book";

// Don't create books/editions directly - use utilities for deduplication
const book = await findOrCreateBook(title, authors);
const edition = await findOrCreateEdition(book.id, isbn, googleBookId);
```

## Auth Pattern

```typescript
// Server-side: getCurrentUser from auth-helpers
import { getCurrentUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // user.id, user.email, user.isAdmin available
}

// Admin check
import { requireAdmin } from "@/lib/auth/admin";

const admin = await requireAdmin();
if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
```
