---
name: Tech Stack Reference
description: Quick reference for the project's technology stack. Use when you need to verify which technologies, versions, or libraries are used in this project.
---

# Tech Stack Reference

## When to use this skill:
- Verifying which library to use for a feature
- Checking version-specific APIs
- Understanding available tools

## Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15 | Framework (App Router) |
| React | 19 | UI library |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 4 | Styling |
| Prisma | 6.15 | ORM |
| PostgreSQL | - | Database (Neon serverless) |
| NextAuth | v5 | Authentication |

## UI Libraries

| Library | Purpose |
|---------|---------|
| Headless UI | Accessible components (Dialog, Menu, Listbox) |
| Heroicons | SVG icons |
| Recharts | Charts and data visualization |

## Testing

| Tool | Purpose |
|------|---------|
| Jest | Test runner |
| React Testing Library | Component testing |
| @testing-library/jest-dom | DOM matchers |

## External APIs

| API | Purpose |
|-----|---------|
| Google Books | Book metadata, covers |
| Hardcover | Book metadata |
| IBDB | Book metadata |

## Key File Locations

```
prisma/schema.prisma     # Database schema
src/lib/prisma.ts        # Prisma client singleton
src/lib/auth.ts          # NextAuth configuration
src/lib/auth-helpers.ts  # getCurrentUser()
src/middleware.ts        # Route protection
src/app/globals.css      # Global styles, CSS variables
```

## Commands Quick Reference

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build
npm run lint             # ESLint

# Database
npx prisma migrate dev   # Create migration
npx prisma studio        # Database GUI
npx prisma generate      # Regenerate client

# Testing
npm run test             # Run all tests
npm run test -- --watch  # Watch mode
```

## Import Patterns

```typescript
// Database
import { prisma } from "@/lib/prisma";

// Auth
import { getCurrentUser } from "@/lib/auth-helpers";
import { requireAdmin } from "@/lib/auth/admin";

// Types
import type { UserBook, Edition } from "@/types/book";

// UI Components
import { Dialog, DialogPanel } from "@headlessui/react";
import { PlusIcon } from "@heroicons/react/24/outline";

// Charts
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
```
