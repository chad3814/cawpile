# Tech Stack

## Frontend

### Framework and Runtime

**Next.js 16 (App Router)**
- React framework with server-side rendering and API routes
- App Router with file-system based routing, layouts, and nested routes
- Server Components by default; `"use client"` for modals, forms, and hooks
- Turbopack development server for fast refresh

**React 19.1**
- Server component support and concurrent rendering
- Latest hooks API

**TypeScript**
- Static typing across the entire codebase
- Path alias `@/` mapped to `src/` for clean imports

### Styling and UI

**TailwindCSS 4**
- Utility-first CSS framework
- Dark mode via `prefers-color-scheme`
- Custom design tokens via CSS variables in globals.css

**Headless UI**
- Unstyled, accessible UI primitives (Dialog, Menu, Listbox, Transition)
- WCAG-compliant with full keyboard navigation

**Heroicons**
- SVG icon set from the Tailwind team
- Tree-shakeable imports

### Data Visualization

**Recharts v3.2**
- Composable React charting library
- Used for line charts, bar charts, and pie charts in the analytics dashboard
- Responsive and declarative API

---

## Backend

### API Layer

**Next.js API Routes**
- RESTful endpoints co-located with the frontend
- Serverless functions in production
- Routes at `src/app/api/` following resource-based naming

### Database

**PostgreSQL (Neon Serverless)**
- Relational database with ACID compliance
- Neon provides serverless scaling, connection pooling, and database branching
- Connection via `@neondatabase/serverless` adapter

**Prisma ORM v6.15**
- Type-safe database client generated from `prisma/schema.prisma`
- Migration management with `prisma migrate`
- Singleton client pattern (`src/lib/prisma.ts`) to prevent connection exhaustion in serverless
- Prisma Studio for development database GUI

### Authentication

**NextAuth v5 (Auth.js)**
- Google OAuth 2.0 as the login provider
- Prisma Adapter for persisting users, sessions, and accounts
- JWT session strategy
- Middleware-based route protection at `src/middleware.ts`

### External APIs

**Google Books API**
- Book metadata: covers, descriptions, page counts, categories
- ISBN lookup for edition enrichment

**Hardcover API**
- GraphQL API for alternative book metadata and cover images

**IBDB (Internet Book Database)**
- Additional book source for broader coverage

---

## Testing

**Jest**
- Test runner with coverage reporting
- Tests located in `__tests__/` mirroring `src/` structure

**React Testing Library**
- Component testing with user-centric DOM queries
- `@testing-library/jest-dom` for custom matchers

### Test Commands
- `npm run test` -- Run all tests
- `npm run test:watch` -- Watch mode
- `npm run test:coverage` -- Coverage report
- `npm run test -- path/to/test` -- Run specific file

---

## Development Tools

**ESLint**
- Code quality and style enforcement
- Next.js and TypeScript rule sets

**Turbopack**
- Rust-based bundler for development (Next.js default)
- Incremental compilation for fast refresh

---

## Deployment

**Vercel** (recommended)
- Optimized for Next.js with edge functions and automatic deployments

**Neon**
- Serverless PostgreSQL hosting with automatic scaling

### Build Pipeline
1. `prisma generate` -- Generate Prisma client
2. `next build` -- Compile application
3. API routes deployed as serverless functions
4. Static pages optimized at build time

---

## Environment Variables

### Required
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `NEXTAUTH_URL` | Public application URL |
| `NEXTAUTH_SECRET` | Session encryption key |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `GOOGLE_BOOKS_API_KEY` | Google Books API access |

### Optional
| Variable | Purpose |
|----------|---------|
| `ADMIN_EMAILS` | Comma-separated list of emails to auto-promote to admin |
