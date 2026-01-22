# Database Schema Reference

Complete Prisma schema documentation for Cawpile.

## Overview

Cawpile uses PostgreSQL (Neon serverless) with Prisma ORM v6.15.

**Connection:** Singleton pattern via `src/lib/prisma.ts` prevents connection pool exhaustion.

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER MANAGEMENT                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐                   │
│  │ Account  │────▶│   User   │◀────│ Session  │                   │
│  └──────────┘     └────┬─────┘     └──────────┘                   │
│                        │                                           │
│         ┌──────────────┼──────────────┬───────────────┐           │
│         ▼              ▼              ▼               ▼           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐   │
│  │ UserBook   │ │UserBookClub│ │UserReadathon│ │AdminAuditLog│   │
│  └─────┬──────┘ └────────────┘ └────────────┘ └──────────────┘   │
│        │                                                          │
└────────┼──────────────────────────────────────────────────────────┘
         │
┌────────┼──────────────────────────────────────────────────────────┐
│        │                    BOOK MANAGEMENT                        │
├────────┼──────────────────────────────────────────────────────────┤
│        │                                                          │
│        │    ┌──────────┐                                          │
│        │    │   Book   │ (deduplicated by title+authors)          │
│        │    └────┬─────┘                                          │
│        │         │ 1:N                                            │
│        │         ▼                                                │
│        │    ┌──────────┐                                          │
│        └───▶│ Edition  │ (ISBN-specific)                          │
│             └────┬─────┘                                          │
│                  │                                                │
│     ┌────────────┼────────────┬────────────┐                     │
│     ▼            ▼            ▼            ▼                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │GoogleBook│ │Hardcover │ │ IbdbBook │ │ UserBook │             │
│ └──────────┘ └──────────┘ └──────────┘ └────┬─────┘             │
│                                              │                    │
│                    ┌─────────────────────────┼─────────┐         │
│                    ▼                         ▼         ▼         │
│             ┌──────────────┐     ┌──────────────┐ ┌────────┐    │
│             │CawpileRating │     │ReadingSession│ │Shared  │    │
│             └──────────────┘     └──────────────┘ │Review  │    │
│                                                   └────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Models

### User

NextAuth user with app-specific extensions.

```prisma
model User {
  id                String    @id @default(cuid())
  name              String?
  email             String    @unique
  emailVerified     DateTime?
  image             String?

  // Profile
  username          String?   @unique
  bio               String?
  profilePictureUrl String?

  // Permissions
  isAdmin           Boolean   @default(false)
  isSuperAdmin      Boolean   @default(false)

  // Preferences
  readingGoal       Int?
  dashboardLayout   DashboardLayout @default(GRID)
  librarySortBy     LibrarySortBy   @default(END_DATE)
  librarySortOrder  LibrarySortOrder @default(DESC)

  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  accounts          Account[]
  sessions          Session[]
  userBooks         UserBook[]
  bookClubs         UserBookClub[]
  readathons        UserReadathon[]
  adminActions      AdminAuditLog[]
  sharedReviews     SharedReview[]
}
```

### Book

Deduplicated book entity (unique on title + authors).

```prisma
model Book {
  id           String    @id @default(cuid())
  title        String
  authors      String[]
  language     String?
  bookType     BookType  @default(FICTION)
  primaryGenre String?

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  editions     Edition[]

  @@unique([title, authors])
}
```

### Edition

ISBN-specific book edition with provider metadata.

```prisma
model Edition {
  id            String   @id @default(cuid())
  isbn10        String?  @unique
  isbn13        String?  @unique
  googleBooksId String?  @unique

  title         String
  authors       String[]
  format        String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  bookId        String
  book          Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)

  googleBook    GoogleBook?
  hardcoverBook HardcoverBook?
  ibdbBook      IbdbBook?
  userBooks     UserBook[]
}
```

### UserBook

User's reading record for a specific edition.

```prisma
model UserBook {
  id          String     @id @default(cuid())
  userId      String
  editionId   String

  // Status
  status      BookStatus @default(WANT_TO_READ)
  format      BookFormat[]

  // Progress
  startDate   DateTime?
  finishDate  DateTime?
  progress    Int        @default(0)  // 0-100
  currentPage Int?

  // Content
  review      String?
  notes       String?
  isFavorite  Boolean    @default(false)
  dnfReason   String?

  // Tracking
  acquisitionMethod    AcquisitionMethod?
  bookClubName         String?
  readathonName        String?
  isReread             Boolean @default(false)

  // Representation
  lgbtqRepresentation      RepresentationValue?
  lgbtqDetails             String?
  disabilityRepresentation RepresentationValue?
  disabilityDetails        String?
  isNewAuthor              Boolean?
  authorPoc                RepresentationValue?
  authorPocDetails         String?

  // Cover preference
  preferredCoverProvider   String?

  // Timestamps
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  // Relations
  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  edition     Edition    @relation(fields: [editionId], references: [id], onDelete: Cascade)

  cawpileRating    CawpileRating?
  readingSessions  ReadingSession[]
  sharedReview     SharedReview?

  @@unique([userId, editionId])
}
```

### CawpileRating

7-facet rating system with computed values.

```prisma
model CawpileRating {
  id          String   @id @default(cuid())
  userBookId  String   @unique

  // Facets (1-10 scale, nullable)
  characters  Int?     // Fiction: Characters | Non-Fiction: Credibility
  atmosphere  Int?     // Fiction: Atmosphere | Non-Fiction: Authenticity
  writing     Int?     // Writing quality
  plot        Int?     // Fiction: Plot | Non-Fiction: Personal Impact
  intrigue    Int?     // How engaging/compelling
  logic       Int?     // Internal consistency
  enjoyment   Int?     // Overall enjoyment

  // Computed values
  average     Float?   // Average of non-null facets
  stars       Int?     // 0-5 star rating
  grade       String?  // A+ through F

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userBook    UserBook @relation(fields: [userBookId], references: [id], onDelete: Cascade)
}
```

**Facet Mapping:**

| Facet | Fiction | Non-Fiction |
|-------|---------|-------------|
| C | Characters | Credibility |
| A | Atmosphere | Authenticity |
| W | Writing | Writing |
| P | Plot | Personal Impact |
| I | Intrigue | Intrigue |
| L | Logic | Logic |
| E | Enjoyment | Enjoyment |

### ReadingSession

Page-by-page progress tracking.

```prisma
model ReadingSession {
  id          String   @id @default(cuid())
  userBookId  String

  startPage   Int
  endPage     Int
  pagesRead   Int
  duration    Int?     // Minutes
  sessionDate DateTime @default(now())
  notes       String?

  createdAt   DateTime @default(now())

  userBook    UserBook @relation(fields: [userBookId], references: [id], onDelete: Cascade)
}
```

### Provider Metadata Models

```prisma
model GoogleBook {
  id          String   @id @default(cuid())
  editionId   String   @unique

  title       String?
  subtitle    String?
  authors     String[]
  publisher   String?
  publishedDate String?
  description String?
  pageCount   Int?
  categories  String[]
  imageUrl    String?
  language    String?

  // Raw data
  rawData     Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  edition     Edition  @relation(fields: [editionId], references: [id], onDelete: Cascade)
}

model HardcoverBook {
  id          String   @id @default(cuid())
  editionId   String   @unique
  hardcoverId String?

  title       String?
  authors     String[]
  description String?
  pageCount   Int?
  categories  String[]
  imageUrl    String?
  publishedDate String?

  rawData     Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  edition     Edition  @relation(fields: [editionId], references: [id], onDelete: Cascade)
}

model IbdbBook {
  id          String   @id @default(cuid())
  editionId   String   @unique
  ibdbId      String?

  title       String?
  authors     String[]
  description String?
  pageCount   Int?
  categories  String[]
  imageUrl    String?
  publishedDate String?

  rawData     Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  edition     Edition  @relation(fields: [editionId], references: [id], onDelete: Cascade)
}
```

### SharedReview

Public sharing with privacy controls.

```prisma
model SharedReview {
  id          String   @id @default(cuid())
  userId      String
  userBookId  String   @unique
  shareToken  String   @unique @default(cuid())

  // Privacy controls
  showDates      Boolean @default(true)
  showBookClubs  Boolean @default(false)
  showReadathons Boolean @default(false)
  showReview     Boolean @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userBook    UserBook @relation(fields: [userBookId], references: [id], onDelete: Cascade)
}
```

### Autocomplete Tracking

```prisma
model UserBookClub {
  id         String   @id @default(cuid())
  userId     String
  name       String
  usageCount Int      @default(1)
  lastUsed   DateTime @default(now())

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name])
}

model UserReadathon {
  id         String   @id @default(cuid())
  userId     String
  name       String
  usageCount Int      @default(1)
  lastUsed   DateTime @default(now())

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name])
}
```

### AdminAuditLog

Admin action audit trail.

```prisma
model AdminAuditLog {
  id          String   @id @default(cuid())
  adminId     String

  entityType  String   // "book", "user", "edition"
  entityId    String
  actionType  AuditActionType

  fieldName   String?
  oldValue    String?  // JSON stringified
  newValue    String?  // JSON stringified

  timestamp   DateTime @default(now())

  admin       User     @relation(fields: [adminId], references: [id])
}
```

---

## Enums

```prisma
enum BookStatus {
  WANT_TO_READ
  READING
  COMPLETED
  DNF
}

enum BookFormat {
  HARDCOVER
  PAPERBACK
  EBOOK
  AUDIOBOOK
}

enum BookType {
  FICTION
  NONFICTION
}

enum DashboardLayout {
  GRID
  TABLE
}

enum LibrarySortBy {
  END_DATE
  START_DATE
  TITLE
  DATE_ADDED
}

enum LibrarySortOrder {
  ASC
  DESC
}

enum AcquisitionMethod {
  PURCHASED
  LIBRARY
  GIFTED
  BORROWED
  FREE
  SUBSCRIPTION
  OTHER
}

enum RepresentationValue {
  YES
  NO
  UNKNOWN
}

enum AuditActionType {
  CREATE
  UPDATE
  DELETE
  MERGE
  RESYNC
}
```

---

## Unique Constraints

| Model | Constraint | Purpose |
|-------|------------|---------|
| `User` | `email` | One account per email |
| `User` | `username` | Unique usernames for profiles |
| `Book` | `[title, authors]` | Deduplicate books |
| `Edition` | `isbn10` | Unique ISBN-10 |
| `Edition` | `isbn13` | Unique ISBN-13 |
| `Edition` | `googleBooksId` | Unique Google Books ID |
| `UserBook` | `[userId, editionId]` | One entry per user per edition |
| `CawpileRating` | `userBookId` | One rating per user book |
| `SharedReview` | `userBookId` | One share per user book |
| `SharedReview` | `shareToken` | Unique share links |
| `UserBookClub` | `[userId, name]` | Unique clubs per user |
| `UserReadathon` | `[userId, name]` | Unique readathons per user |

---

## Indexes

Implicit indexes are created for:
- All `@id` fields
- All `@unique` fields
- All foreign key fields (`@relation`)

Consider adding explicit indexes for:
- `UserBook.status` (frequent filtering)
- `UserBook.finishDate` (chart queries)
- `AdminAuditLog.timestamp` (audit log queries)

---

## Migrations

```bash
# Development
npx prisma migrate dev --name description

# Production
npx prisma migrate deploy

# Reset (development only)
npx prisma migrate reset

# View schema
npx prisma studio
```

---

## Common Queries

### Get User's Library

```typescript
const books = await prisma.userBook.findMany({
  where: { userId, status: 'COMPLETED' },
  include: {
    edition: {
      include: {
        book: true,
        googleBook: true,
      },
    },
    cawpileRating: true,
  },
  orderBy: { finishDate: 'desc' },
});
```

### Find or Create Book

```typescript
const book = await prisma.book.upsert({
  where: { title_authors: { title, authors } },
  create: { title, authors, bookType },
  update: {},
});
```

### Get Chart Data

```typescript
const completedBooks = await prisma.userBook.findMany({
  where: {
    userId,
    status: 'COMPLETED',
    finishDate: {
      gte: new Date(`${year}-01-01`),
      lt: new Date(`${year + 1}-01-01`),
    },
  },
  select: {
    finishDate: true,
    edition: { select: { googleBook: { select: { pageCount: true } } } },
  },
});
```

---

## Database Utilities

Located in `src/lib/db/`:

| Function | Purpose |
|----------|---------|
| `findOrCreateBook()` | Create book with deduplication |
| `findOrCreateEdition()` | Create edition with validation |
| `getEnrichedBookData()` | Merge multi-provider metadata |
| `upsertAllProviderRecords()` | Update Google/Hardcover/IBDB |
| `getUserProfile()` | Get public profile data |
| `getProfileSharedReviews()` | Get user's shared reviews |
