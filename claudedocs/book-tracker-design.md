# Book Tracker - System Design Document

## 1. System Overview

**BookShelf** - A modern web application for tracking personal reading habits, managing book collections, and discovering new reads through community features.

### Core Features
- User authentication and profiles
- Book library management (currently reading, want to read, completed)
- Reading progress tracking
- Book reviews and ratings
- Reading statistics and goals
- Social features (friends, book recommendations)
- Book search and discovery

## 2. Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐    │
│  │  Pages  │ │   UI    │ │  State   │ │   Services   │    │
│  │  /App   │ │ Comps   │ │ Manager  │ │  (API calls) │    │
│  └─────────┘ └─────────┘ └──────────┘ └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js API Routes)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │   Auth   │ │  Books   │ │  Users   │ │   Reading    │  │
│  │ Handler  │ │   API    │ │   API    │ │   Progress   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (PostgreSQL)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Users   │ │  Books   │ │ User     │ │   Reading    │  │
│  │  Table   │ │  Table   │ │ Books    │ │   Sessions   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   External Services                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐   │
│  │ Google Books │ │   Auth0/     │ │   Cloudinary     │   │
│  │     API      │ │   NextAuth   │ │ (Image Storage)  │   │
│  └──────────────┘ └──────────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: TailwindCSS 4
- **State Management**: Zustand or Redux Toolkit
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts (for reading statistics)

#### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Authentication**: NextAuth.js v5
- **Database ORM**: Prisma
- **API Validation**: Zod

#### Database
- **Primary**: PostgreSQL (Supabase or Neon)
- **Caching**: Redis (optional for performance)

#### External Services
- **Book Data**: Google Books API
- **Image Storage**: Cloudinary or AWS S3
- **Email**: SendGrid or Resend

## 3. Database Schema

### Core Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    reading_goal INTEGER DEFAULT 12,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Books table (cached from external API)
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_books_id VARCHAR(255) UNIQUE,
    isbn_10 VARCHAR(13),
    isbn_13 VARCHAR(17),
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    authors TEXT[], -- Array of author names
    description TEXT,
    published_date DATE,
    publisher VARCHAR(255),
    page_count INTEGER,
    categories TEXT[],
    cover_image_url TEXT,
    language VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User's book library
CREATE TABLE user_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('want_to_read', 'reading', 'completed', 'dnf')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    notes TEXT,
    start_date DATE,
    finish_date DATE,
    current_page INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

-- Reading sessions for progress tracking
CREATE TABLE reading_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_book_id UUID REFERENCES user_books(id) ON DELETE CASCADE,
    start_page INTEGER NOT NULL,
    end_page INTEGER NOT NULL,
    duration_minutes INTEGER,
    notes TEXT,
    session_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Book collections/lists
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collection_books (
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, book_id)
);

-- Social features
CREATE TABLE follows (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE book_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_books_user_status ON user_books(user_id, status);
CREATE INDEX idx_user_books_dates ON user_books(start_date, finish_date);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_authors ON books USING GIN(authors);
CREATE INDEX idx_reading_sessions_date ON reading_sessions(session_date);
```

## 4. API Specification

### Authentication Endpoints

```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  name?: string;
}

// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
}

// Response for both
interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    name?: string;
    avatarUrl?: string;
  };
  token: string;
}
```

### Book Management Endpoints

```typescript
// GET /api/books/search?q={query}&limit=20
interface BookSearchResponse {
  books: Book[];
  totalResults: number;
}

// GET /api/books/{bookId}
interface Book {
  id: string;
  googleBooksId?: string;
  title: string;
  subtitle?: string;
  authors: string[];
  description?: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  categories?: string[];
  coverImageUrl?: string;
  averageRating?: number;
  ratingsCount?: number;
}

// POST /api/user/books
interface AddBookRequest {
  bookId?: string;       // If book exists in DB
  googleBooksId?: string; // If fetching from Google Books
  status: 'want_to_read' | 'reading' | 'completed' | 'dnf';
  startDate?: string;
}

// PUT /api/user/books/{userBookId}
interface UpdateBookRequest {
  status?: 'want_to_read' | 'reading' | 'completed' | 'dnf';
  rating?: number;
  review?: string;
  notes?: string;
  currentPage?: number;
  startDate?: string;
  finishDate?: string;
  isFavorite?: boolean;
}

// GET /api/user/books?status={status}&limit=20&offset=0
interface UserBooksResponse {
  books: UserBook[];
  total: number;
  stats: {
    wantToRead: number;
    reading: number;
    completed: number;
    dnf: number;
  };
}
```

### Reading Progress Endpoints

```typescript
// POST /api/reading-sessions
interface CreateSessionRequest {
  userBookId: string;
  startPage: number;
  endPage: number;
  durationMinutes?: number;
  notes?: string;
  sessionDate?: string;
}

// GET /api/user/stats?year={year}
interface UserStatsResponse {
  booksRead: number;
  pagesRead: number;
  averageRating: number;
  readingGoal: number;
  goalProgress: number;
  favoriteAuthors: string[];
  favoriteCategories: string[];
  monthlyBreakdown: {
    month: string;
    booksCompleted: number;
    pagesRead: number;
  }[];
}
```

## 5. UI Component Architecture

### Page Structure

```
/app
├── (auth)
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)
│   ├── layout.tsx
│   ├── page.tsx (Dashboard)
│   ├── library/page.tsx
│   ├── books/[id]/page.tsx
│   ├── reading/page.tsx
│   ├── stats/page.tsx
│   └── profile/page.tsx
├── search/page.tsx
└── api/
    ├── auth/[...nextauth]/route.ts
    ├── books/route.ts
    └── user/books/route.ts
```

### Core UI Components

```typescript
// Book Card Component
interface BookCardProps {
  book: Book;
  userBook?: UserBook;
  variant: 'compact' | 'detailed' | 'minimal';
  onStatusChange?: (status: string) => void;
  onRatingChange?: (rating: number) => void;
}

// Reading Progress Component
interface ReadingProgressProps {
  currentPage: number;
  totalPages: number;
  startDate?: Date;
  estimatedFinishDate?: Date;
  onProgressUpdate?: (page: number) => void;
}

// Book Search Component
interface BookSearchProps {
  onBookSelect: (book: Book) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

// Statistics Dashboard Component
interface StatsDisplayProps {
  stats: UserStats;
  timeframe: 'week' | 'month' | 'year' | 'all';
  onTimeframeChange: (timeframe: string) => void;
}
```

### User Flows

#### 1. Adding a Book
```
Search for book → Select from results → Choose reading status → 
Add to library → (Optional) Set reading goal/start date
```

#### 2. Tracking Progress
```
Open current book → Update current page → 
(Optional) Add session notes → View progress visualization
```

#### 3. Completing a Book
```
Mark as completed → Add rating → 
(Optional) Write review → Book moves to completed shelf
```

## 6. Security & Performance

### Security Measures
- JWT-based authentication with refresh tokens
- Input validation using Zod schemas
- SQL injection prevention via Prisma ORM
- Rate limiting on API endpoints
- CORS configuration for API access
- Environment variables for sensitive data

### Performance Optimization
- Database indexing on frequently queried fields
- Image optimization and CDN delivery
- API response caching for book data
- Pagination for large lists
- Progressive loading for book covers
- Server-side rendering for SEO pages

### Scalability Considerations
- Horizontal scaling via containerization
- Database connection pooling
- Background jobs for heavy operations
- CDN for static assets
- API versioning for backwards compatibility

## 7. Development Phases

### Phase 1: MVP (Week 1-2)
- User authentication
- Book search and library management
- Basic reading status tracking
- Simple book cards and lists

### Phase 2: Core Features (Week 3-4)
- Reading progress tracking
- Book reviews and ratings
- User profile and settings
- Reading statistics dashboard

### Phase 3: Social Features (Week 5-6)
- User following system
- Book recommendations
- Public reading lists
- Activity feed

### Phase 4: Polish & Enhancement (Week 7-8)
- Mobile responsive design
- Advanced search filters
- Export reading data
- Reading challenges/goals
- Performance optimization

## 8. Testing Strategy

### Unit Tests
- Component rendering tests
- API endpoint validation
- Database query testing
- Utility function tests

### Integration Tests
- User authentication flow
- Book management workflows
- Reading progress updates
- API integration tests

### E2E Tests
- Complete user journeys
- Cross-browser compatibility
- Mobile responsiveness
- Performance benchmarks