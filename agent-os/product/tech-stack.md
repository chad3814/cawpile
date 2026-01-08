# Tech Stack

## Frontend

### Framework & Runtime

**Next.js 15 (App Router)**

- Modern React framework with server-side rendering and API routes
- App Router provides file-system based routing with layouts and nested routes
- Server Components reduce client bundle size and improve initial load times
- Built-in optimization for images, fonts, and scripts

**React 19**

- Latest React with improved server component support
- Enhanced hooks and concurrent rendering features
- Better developer experience with improved error messages

**TypeScript**

- Static typing prevents runtime errors and improves code maintainability
- Enhanced IDE support with intelligent autocomplete and refactoring
- Self-documenting code through type definitions
- Catches errors at compile time rather than production

### Styling & UI

**TailwindCSS 4**

- Utility-first CSS framework for rapid UI development
- Custom design system via CSS variables in globals.css
- Dark mode support through prefers-color-scheme
- Purges unused styles for minimal production bundle size

**Headless UI**

- Unstyled, accessible UI components (Dialog, Menu, Listbox)
- WCAG-compliant out of the box
- Full keyboard navigation support
- Flexible styling without fighting default styles

**Heroicons**

- Official Tailwind icon set with consistent design language
- SVG-based for crisp rendering at any size
- Tree-shakeable imports for optimal bundle size

### Data Visualization

**Recharts v3.2**

- Composable charting library built on React components
- Responsive charts that adapt to container size
- Supports line charts, bar charts, pie charts used in analytics dashboard
- Declarative API matches React patterns

## Backend

### API Layer

**Next.js API Routes**

- Serverless API endpoints co-located with frontend code
- RESTful architecture with clear resource-based routing
- Automatic code splitting and deployment optimization
- Simplified deployment (single Next.js app vs separate backend)

### Database & ORM

**PostgreSQL (Neon Serverless)**

- Robust relational database with ACID compliance
- Complex queries with joins for book/edition relationships
- Full-text search capabilities for book discovery
- Neon provides serverless scaling and connection pooling

**Prisma ORM v6.15**

- Type-safe database client generated from schema
- Automatic migrations with `prisma migrate`
- Intuitive query API prevents SQL injection
- Built-in connection pooling via `@neondatabase/serverless`
- Prisma Studio for database GUI during development

### Authentication

**NextAuth v5**

- Drop-in authentication solution with minimal configuration
- Google OAuth 2.0 provider for social login
- JWT session strategy for stateless authentication
- Prisma Adapter for storing users, sessions, accounts
- Built-in CSRF protection and secure session handling

### External APIs

**Google Books API**

- Rich book metadata (covers, descriptions, page counts, categories)
- ISBN lookup for book enrichment
- Fallback to multiple search providers for coverage
- Free tier sufficient for typical usage patterns

## Development Tools

### Code Quality

**ESLint**

- Catches common errors and enforces code style consistency
- Next.js-specific rules for optimal framework usage
- TypeScript integration for type-aware linting

### Build System

**Turbopack**

- Next.js 15 default bundler (Rust-based)
- Faster development server startup than Webpack
- Incremental compilation for near-instant updates

## Architecture Patterns

### Data Layer

**Dual-Level Book Storage**

- Book model: Title + authors (deduplicated across editions)
- Edition model: ISBN-specific metadata per format
- GoogleBook enrichment layer for API data
- Prevents duplicate books while supporting multiple editions

**Singleton Prisma Client** (`src/lib/prisma.ts`)

- Prevents connection pool exhaustion in serverless environment
- Reuses database connections across API route invocations

### Search Architecture

**Orchestrator Pattern** (`src/lib/search/SearchOrchestrator.ts`)

- Parallel execution of multiple search providers with `Promise.allSettled`
- Provider registration with weight-based result ranking
- Intelligent result merging with deduplication via fuzzy matching
- Graceful degradation if providers fail

### Security & Audit

**Middleware-Based Route Protection** (`src/middleware.ts`)

- Redirects unauthenticated users to `/auth/signin`
- Protects dashboard and API routes at edge before rendering

**Admin Audit Trail** (`src/lib/audit/`)

- Logs all admin actions with before/after values
- Stored in AdminAuditLog table for compliance
- Tracks who, what, when for accountability

### State Management

**Chart Data Context** (`contexts/ChartDataContext.tsx`)

- Client-side caching with 30-minute TTL
- SessionStorage persistence across page reloads
- Reduces redundant API calls for analytics data
- Per-chart loading and error states

### Form Patterns

**Wizard Pattern** (`components/modals/AddBookWizard.tsx`)

- Multi-step forms with conditional logic based on book status
- Progress indicator showing current step
- Local state management via `useState` hooks

**Reusable Form Fields** (`components/forms/`)

- Encapsulated field components with built-in validation
- Used across multiple modals for consistency
- Examples: AcquisitionMethodField, BookClubField, ReadathonField

## Deployment & Environment

### Environment Variables

**Required:**

- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `NEXTAUTH_URL` - Public application URL
- `NEXTAUTH_SECRET` - Session encryption key (32-char random)
- `GOOGLE_CLIENT_ID` - OAuth 2.0 Client ID
- `GOOGLE_CLIENT_SECRET` - OAuth 2.0 Client Secret
- `GOOGLE_BOOKS_API_KEY` - Google Books API access

**Optional:**

- `ADMIN_EMAILS` - Auto-promote users to admin on first login
- `DEBUG` - Enable debug logging (development)
- `SESSION_MAX_AGE` - Session duration in seconds (default: 6 months)

### Build Pipeline

1. `prisma generate` - Generate Prisma client from schema
2. `next build` - Compile Next.js app with Turbopack
3. Static optimization for pages without server-side data
4. API routes bundled as serverless functions

## Future Considerations

### Testing (Not Yet Implemented)

- Jest + React Testing Library for component tests
- Playwright for E2E testing
- Prisma test database setup for integration tests

### Performance Monitoring

- Vercel Analytics or Sentry for error tracking
- Database query performance monitoring
- API route latency tracking

### Scalability

- Redis caching layer for frequently accessed data
- CDN for static assets and book cover images
- Database read replicas for analytics queries
- Rate limiting for external API calls
