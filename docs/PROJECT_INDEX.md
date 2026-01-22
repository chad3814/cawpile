# Cawpile Project Index

> Book reading tracker with custom CAWPILE rating system

## Quick Navigation

| Section | Description |
|---------|-------------|
| [Directory Structure](#directory-structure) | Project folder organization |
| [API Reference](#api-reference) | All REST endpoints |
| [Database Schema](#database-schema) | Prisma models and relationships |
| [Components](#components) | React component catalog |
| [Utilities](#utilities) | Helper functions and services |
| [Architecture](#architecture) | System design patterns |

---

## Directory Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # REST API endpoints
│   │   ├── auth/         # NextAuth authentication
│   │   ├── books/        # Book search
│   │   ├── charts/       # Chart data (10 endpoints)
│   │   ├── user/         # User operations
│   │   ├── admin/        # Admin operations
│   │   ├── profile/      # Public profiles
│   │   └── share/        # Shared reviews
│   ├── dashboard/        # Main user dashboard
│   ├── admin/            # Admin interface
│   ├── settings/         # User settings
│   ├── auth/             # Sign-in page
│   ├── share/            # Public share pages
│   └── u/                # Public user profiles
│
├── components/
│   ├── admin/            # Admin UI (tables, forms, filters)
│   ├── charts/           # Recharts visualizations
│   ├── dashboard/        # Dashboard views (grid, table)
│   ├── modals/           # Modal dialogs (wizard, details)
│   ├── forms/            # Reusable form fields
│   ├── rating/           # CAWPILE rating UI
│   ├── profile/          # Public profile components
│   ├── share/            # Social sharing
│   ├── settings/         # Settings UI
│   └── layout/           # Header, footer, nav
│
├── lib/
│   ├── search/           # Multi-provider search system
│   │   ├── providers/   # Search provider implementations
│   │   └── utils/       # Fuzzy matching, merging
│   ├── db/              # Database utilities
│   ├── charts/          # Chart processors
│   ├── auth/            # Admin auth helpers
│   ├── audit/           # Action logging
│   ├── image/           # Image generation
│   └── utils/           # General utilities
│
├── types/                # TypeScript definitions
├── hooks/                # Custom React hooks
├── contexts/             # React context providers
└── middleware.ts         # Route protection

prisma/
├── schema.prisma         # Database schema
└── migrations/           # Migration history

__tests__/
├── api/                  # API route tests
├── components/           # Component tests
└── lib/                  # Utility tests
```

---

## API Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | ALL | NextAuth.js handlers |

### Books (User)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/books/search` | GET | Multi-provider book search |
| `/api/user/books` | GET | Get user's library |
| `/api/user/books` | POST | Add book to library |
| `/api/user/books/[id]` | PATCH | Update book (progress, status) |
| `/api/user/books/[id]` | DELETE | Remove from library |
| `/api/user/books/[id]/share` | POST | Create shared review |
| `/api/user/books/[id]/share` | DELETE | Remove shared review |

### User Preferences
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/preferences` | PATCH | Update dashboard layout |
| `/api/user/settings` | PATCH | Update user settings |
| `/api/user/book-clubs` | GET | Autocomplete book clubs |
| `/api/user/readathons` | GET | Autocomplete readathons |
| `/api/user/avatar` | POST | Upload avatar |
| `/api/user/username-check` | GET | Check username availability |

### Charts
| Endpoint | Query | Description |
|----------|-------|-------------|
| `/api/charts/books-per-month` | `?year=YYYY` | Monthly book volume |
| `/api/charts/pages-per-month` | `?year=YYYY` | Pages read per month |
| `/api/charts/dnf-per-month` | `?year=YYYY` | Did-not-finish tracking |
| `/api/charts/book-format` | `?year=YYYY` | Format distribution |
| `/api/charts/main-genres` | `?year=YYYY` | Fiction vs non-fiction |
| `/api/charts/acquisition-method` | `?year=YYYY` | How books acquired |
| `/api/charts/lgbtq-representation` | `?year=YYYY` | LGBTQ+ representation |
| `/api/charts/disability-representation` | `?year=YYYY` | Disability representation |
| `/api/charts/poc-authors` | `?year=YYYY` | POC author stats |
| `/api/charts/new-authors` | `?year=YYYY` | New-to-user authors |
| `/api/charts/available-years` | - | Years with data |

### Admin
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/books` | GET | Paginated book list |
| `/api/admin/books` | POST | Create book |
| `/api/admin/books/[id]` | PATCH | Update book |
| `/api/admin/books/[id]` | DELETE | Delete book |
| `/api/admin/books/[id]/resync` | POST | Resync provider data |
| `/api/admin/books/bulk` | POST | Bulk operations |
| `/api/admin/users` | GET | User list |
| `/api/admin/users/[id]` | PATCH | Update user role |
| `/api/admin/audit-log` | GET | Admin action trail |
| `/api/admin/stats` | GET | System statistics |
| `/api/admin/data-quality` | GET | Data quality metrics |

### Public
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/profile/[username]` | GET | Public profile data |
| `/api/share/reviews/[shareToken]` | GET | Shared review data |

---

## Database Schema

### Core Models

```
User
├── id, email, name, image
├── username, bio, profilePictureUrl
├── isAdmin, isSuperAdmin
├── readingGoal, dashboardLayout
└── Relations: accounts, sessions, userBooks, sharedReviews

Book (deduplicated by title+authors)
├── id, title, authors[], bookType
├── language, primaryGenre
└── Relations: editions[]

Edition (ISBN-specific)
├── id, isbn10, isbn13, googleBooksId
├── title, authors[], format
├── bookId (foreign key to Book)
└── Relations: googleBook?, hardcoverBook?, ibdbBook?, userBooks[]

UserBook (user's reading record)
├── id, userId, editionId (unique constraint)
├── status: WANT_TO_READ | READING | COMPLETED | DNF
├── format: HARDCOVER | PAPERBACK | EBOOK | AUDIOBOOK
├── startDate, finishDate, progress, currentPage
├── review, notes, isFavorite
├── acquisitionMethod, bookClubName, readathonName
├── Representation: lgbtqRep, disabilityRep, authorPoc, isNewAuthor
└── Relations: cawpileRating?, readingSessions[], sharedReview?

CawpileRating (7-facet rating)
├── userBookId (unique)
├── Facets (1-10): characters, atmosphere, writing, plot, intrigue, logic, enjoyment
└── Computed: average, stars, grade
```

### Provider Metadata
```
GoogleBook   → Edition (1:1)
HardcoverBook → Edition (1:1)
IbdbBook     → Edition (1:1)
```

### Social
```
SharedReview
├── userId, userBookId, shareToken
└── Privacy: showDates, showBookClubs, showReadathons, showReview
```

### Admin
```
AdminAuditLog
├── adminId, entityType, entityId
├── actionType: CREATE | UPDATE | DELETE | MERGE | RESYNC
└── fieldName, oldValue, newValue, timestamp
```

---

## Components

### Dashboard (`/components/dashboard/`)
| Component | Purpose |
|-----------|---------|
| `DashboardClient` | Main dashboard container |
| `BookGrid` | Grid view of books |
| `BookTable` | Table view of books |
| `BookCard` | Individual book card |
| `TabNavigation` | Books/Charts/Stats tabs |
| `ViewSwitcher` | Grid/Table toggle |
| `LayoutToggle` | Layout preference |
| `SortDropdown` | Sort options |

### Modals (`/components/modals/`)
| Component | Purpose |
|-----------|---------|
| `BookSearchModal` | Search and select books |
| `AddBookWizard` | Multi-step add book flow |
| `BookDetailsModal` | View book details |
| `CawpileRatingModal` | 7-facet rating entry |
| `ReviewModal` | Write/edit review |
| `ShareReviewModal` | Share settings |
| `UpdateProgressModal` | Update reading progress |
| `MarkCompleteModal` | Mark book complete |
| `MarkDNFModal` | Mark did-not-finish |

### Charts (`/components/charts/`)
| Component | Purpose |
|-----------|---------|
| `BooksPerMonthChart` | Monthly reading volume |
| `PagesPerMonthChart` | Pages per month |
| `BookFormatChart` | Format distribution |
| `MainGenresChart` | Fiction vs non-fiction |
| `AcquisitionMethodChart` | How acquired |
| `LgbtqRepresentationChart` | LGBTQ+ stats |
| `DisabilityRepresentationChart` | Disability stats |
| `PocAuthorsChart` | POC author stats |
| `NewAuthorsChart` | New author stats |

### Forms (`/components/forms/`)
| Component | Purpose |
|-----------|---------|
| `AcquisitionMethodField` | How acquired dropdown |
| `BookClubField` | Book club autocomplete |
| `ReadathonField` | Readathon autocomplete |
| `FormatMultiSelect` | Format selection |
| `RepresentationField` | Rep tracking fields |
| `ReviewTextareaField` | Review input |

---

## Utilities

### Search System (`/lib/search/`)
```typescript
// Orchestrator pattern with parallel execution
SearchOrchestrator.search(query, options)

// Providers (by weight)
LocalDatabaseProvider  // weight: 10
HardcoverProvider      // weight: 6
GoogleBooksProvider    // weight: 5
IbdbProvider           // weight: 4

// Utilities
mergeResults()         // Deduplicate & rank
fuzzyMatch()           // Levenshtein matching
signResults()          // HMAC-SHA256 signing
verifySignature()      // Signature verification
```

### Database (`/lib/db/`)
```typescript
findOrCreateBook(data)           // Create with deduplication
findOrCreateEdition(data)        // Create with validation
getEnrichedBookData(editionId)   // Merge provider data
upsertAllProviderRecords(...)    // Update all providers
```

### Authentication (`/lib/auth/`)
```typescript
getCurrentUser()       // Get current session user
requireAdmin()         // Redirect if not admin
requireSuperAdmin()    // Redirect if not super admin
checkAdminAccess()     // Boolean admin check
```

### Charts (`/lib/charts/`)
```typescript
// Processors for each chart type
processMonthlyData()
processFormatData()
processRepresentationData()

// Formatting utilities
formatNumber()
formatPercentage()
```

---

## Architecture

### Search System
```
User Search
    ↓
SearchOrchestrator
    ↓ (parallel)
┌───────────────────────────────────────┐
│ LocalDB │ Hardcover │ Google │ IBDB  │
└───────────────────────────────────────┘
    ↓
Result Merger (fuzzy match, dedupe)
    ↓
Ranked Results (by provider weight)
```

### Component Patterns

**Wizard Pattern** - Multi-step forms with conditional steps
- `AddBookWizard`: Status → Format → Tracking → Dates

**Modal Pattern** - Headless UI Dialog with transitions
- Escape key handling, backdrop click, animations

**Context Pattern** - Chart data caching
- 30-minute TTL, sessionStorage persistence
- Per-chart loading/error states

### Data Flow: Adding a Book
```
1. SearchModal → GET /api/books/search
2. SearchOrchestrator → parallel provider queries
3. Result merger → deduplicated results
4. User selects → AddBookWizard (multi-step)
5. POST /api/user/books
6. findOrCreateBook() → findOrCreateEdition()
7. Create UserBook + autocomplete entries
8. Refetch dashboard
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | TailwindCSS 4, Headless UI |
| Charts | Recharts v3.2 |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Neon), Prisma v6.15 |
| Auth | NextAuth v5 (Google OAuth) |
| Storage | AWS S3 |
| Testing | Jest, React Testing Library |

---

## Key Features

1. **CAWPILE Rating** - 7-facet custom rating system
2. **Multi-Provider Search** - Google, Hardcover, IBDB, Local
3. **Reading Progress** - Session-based page tracking
4. **Representation Tracking** - LGBTQ+, disability, POC authors
5. **Social Sharing** - Public reviews with privacy controls
6. **Admin Tools** - Book management, audit logging
7. **Analytics** - 10+ chart types with caching

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project guidelines
- [API Documentation](./API.md) - Detailed API reference
- [Component Catalog](./COMPONENTS.md) - Component documentation
- [Database Schema](./DATABASE.md) - Full schema reference
