# Book Tracker - Session Specification

## Overview
Developing a book tracking web application where users can track books they read, manage their reading lists, and monitor their reading progress.

## Phase 1: Foundation Setup - Detailed Specification

### Database Configuration
- **Hosting**: Neon PostgreSQL through Vercel integration
- **Connection**: Automatic connection pooling via Neon
- **ORM**: Prisma with type-safe queries

### Authentication System
- **Provider**: Google OAuth only (no email/password in Phase 1)
- **Session Duration**: 6-month persistent sessions ("remember me" by default)
- **Library**: NextAuth.js v5 with Google provider
- **User Data**: Store Google profile info (name, email, avatar)

### Data Architecture

#### Books Table (Generic/Consolidated)
- Original title
- Author(s) array
- Original language
- Deduplication: By title + author(s) combination
- Note: Admin tools for merge/split operations in future phases

#### Editions Table
- Foreign key to books table
- ISBN-10 and ISBN-13
- Edition title (if different from original)
- Edition authors (if different)
- Format (hardcover, paperback, ebook, audiobook)
- Google Books ID
- Deduplication: By ISBN

#### Google Books Data Tables
- Store all Google Books API data directly
- Separate tables for Google-specific information
- Enables future integration with other data sources

#### User Books Table
- User's personal library entries
- Status: want_to_read, reading, completed
- Format: hardcover, paperback, ebook, audiobook
- Start date and finish date
- Progress stored as percentage (internally converted from pages/time)

### Navigation Structure

#### Unauthenticated Users
- Landing page with app features and benefits
- Sign in with Google button
- No access to internal pages

#### Authenticated Users
- **Header Navigation**:
  - Logo (left) - links to dashboard
  - "Track Book" button (right of center) - opens search modal
  - User menu (far right) - profile, settings, sign out
- **Default Route**: Dashboard after login

### Dashboard View
- **First Visit**: CTA to add first book with friendly empty state
- **With Books**: 
  - Currently reading books at top
  - Followed by other books in library
  - Basic card view with cover, title, author, progress

### Book Addition Flow

#### Track Book Modal
- Triggered by "Track Book" button from any page
- Search powered by Google Books API
- Results display:
  - Book cover thumbnail
  - Title and author(s)
  - Publication year
  - Truncated description (first 150 characters)

#### Book Addition Wizard (Multi-step Modal)
1. **Step 1**: Choose status and format
   - Status: Want to Read, Reading, Completed
   - Format: Hardcover, Paperback, Ebook, Audiobook

2. **Step 2** (if Reading or Completed): Set start date
   - Date picker with today as default

3. **Step 3** (if Reading): Set current progress
   - Input options: Pages, Time, or Percentage
   - All stored as percentage internally

4. **Step 4** (if Completed): Confirm completion
   - Did you finish? (Yes/No)
   - Finish date picker

Note: Ratings and reviews will be added in later phases

### Progress Tracking
- **Input Methods**: Pages, time (hours:minutes), or percentage
- **Internal Storage**: Always converted to percentage
- **Display**: Show in user's preferred format

### Error Handling (Phase 1)
- Basic error boundaries with generic messages
- Console logging for debugging
- No toast notifications or sophisticated UI feedback yet

### Pages to Implement

1. **/** - Landing page (unauthenticated)
2. **/auth/signin** - Google OAuth sign-in
3. **/dashboard** - User's main view (authenticated)
4. **Modal Components**:
   - Book search modal
   - Book addition wizard modal

## Technical Stack
- Next.js 15 with App Router
- PostgreSQL database (Neon)
- Prisma ORM
- NextAuth.js for authentication
- TailwindCSS for styling
- Google Books API for book data

## Phase 1 Success Criteria
- Working Google OAuth authentication
- Neon PostgreSQL database connected via Prisma
- Ability to search books via Google Books API
- Multi-step book addition flow
- Basic dashboard showing user's books
- Progress tracking with percentage conversion
- 6-month session persistence
