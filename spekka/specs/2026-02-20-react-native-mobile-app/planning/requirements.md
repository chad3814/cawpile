# Spec Requirements: React Native Mobile App

## Initial Description
"Set up a React Native mobile version of the webapp"

The existing Cawpile web application is a book reading tracker with a custom CAWPILE rating system built with Next.js 16, React 19, TypeScript, TailwindCSS 4, Prisma ORM, and NextAuth v5. It features multi-provider book search, reading progress tracking, CAWPILE ratings, analytics charts, admin tools, social sharing, public profiles, monthly video recap generation, and more. The database uses PostgreSQL (Neon serverless) with Prisma ORM, and the API is RESTful via Next.js API routes.

## Requirements Discussion

### First Round Questions

**Q1:** I'm assuming this should be a new standalone React Native project (likely using Expo for faster setup) that lives in a new directory within the monorepo (e.g., `apps/mobile/` or `services/mobile/`). It would consume the existing Next.js API routes as its backend, rather than having its own server-side logic. Is that correct, or were you thinking of a different approach (e.g., a React Native Web hybrid, or an entirely separate repository)?
**Answer:** Yes, move the existing code into `apps/web` and have `apps/mobile` for the new React Native app. This means a monorepo restructure is part of the spec. The mobile app consumes the existing Next.js API routes as its backend.

**Q2:** For authentication, the webapp currently uses NextAuth v5 with Google OAuth and JWT sessions. I'm assuming the mobile app should also support Google Sign-In (via a native Google Sign-In library). Were you planning to add Apple Sign-In as well (which is required by Apple for App Store submission if you offer any third-party login), or should we stick with Google-only for now?
**Answer:** Google-only for now. Apple Sign-In will be added before App Store release but is not in scope for this spec.

**Q3:** Regarding feature scope for the initial version (MVP), I'm assuming the mobile app should focus on core daily-use features. Is that roughly right, or are there features you consider higher or lower priority for mobile?
**Answer:** All the listed core features PLUS social sharing. The MVP includes:
- Book search (multi-provider)
- Library/dashboard view
- Add book wizard
- Reading progress and session logging
- CAWPILE rating entry
- Book details
- Basic settings/profile
- Social sharing/public profiles

Deferred: Analytics charts, Admin panel, Video recap/template system, Data export.

**Q4:** For the charting/analytics feature -- if it is in scope for the initial version, Recharts does not work in React Native. Should we plan for charts in the MVP, or is this a later phase?
**Answer:** NOT in scope for MVP.

**Q5:** The webapp uses TailwindCSS 4 for styling with dark mode via `prefers-color-scheme`. For React Native, I'm assuming we would use NativeWind for maximum style parity with the web app. Do you have a preference?
**Answer:** No preference -- use best judgment. NativeWind for Tailwind parity seems like the natural choice.

**Q6:** For data management on mobile, should we plan for true offline support (e.g., queueing book additions or reading session logs while offline), or is "online-required with good caching" sufficient for the MVP?
**Answer:** Yes, true offline support with queuing actions while offline.

**Q7:** Should the mobile app support barcode/ISBN scanning as a way to search for and add books?
**Answer:** Should be the FIRST post-MVP feature (not in MVP itself, but noted for future).

**Q8:** Is there anything that should explicitly NOT be part of the mobile app, even in future versions? For example, should admin functionality always remain web-only?
**Answer:** Admin functionality should ALWAYS be web-only, even in future versions.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Existing API Routes - Path: `src/app/api/` -- Mobile app should consume these as-is, no changes needed
- Feature: TypeScript Types - Path: `src/types/` (book.ts, cawpile.ts, dashboard.ts, video-template.ts) -- Share via a local shared package in the monorepo
- Feature: Form Field Components - Path: `src/components/forms/` (AcquisitionMethodField, BookClubField, ReadathonField, FormatMultiSelect, RereadField) -- Logic and validation patterns should inform mobile equivalents
- Feature: Add Book Wizard - Path: `src/components/modals/AddBookWizard.tsx` -- Multi-step form pattern to replicate in mobile navigation
- Feature: Dashboard Client - Path: `src/components/dashboard/DashboardClient.tsx` -- Grid/table layout and sorting patterns
- Feature: Book Search Hook - Path: `src/hooks/useBookSearch.ts` -- Search orchestration pattern for mobile
- Feature: Auth Configuration - Path: `src/lib/auth.ts` -- Google OAuth + JWT session strategy to integrate with
- Feature: Search Result Signing - Path: `src/lib/search/utils/signResult.ts` -- HMAC-SHA256 validation between search and book addition
- Feature: Prisma Schema - Path: `prisma/schema.prisma` -- Full data model reference
- No existing mobile apps or design systems to reference

### Follow-up Questions

No follow-up questions were necessary. All answers were clear and comprehensive.

## Visual Assets

### Files Provided:
No visual assets provided. Bash check of `/Users/cwalker/Projects/cawpile/app-work/spekka/specs/2026-02-20-react-native-mobile-app/planning/visuals/` confirmed no image files present.

### Visual Insights:
N/A -- No visual assets to analyze.

## Requirements Summary

### Functional Requirements
- **Monorepo Restructure**: Move existing webapp code from root into `apps/web/`, create `apps/mobile/` for React Native app, and create a shared package for common TypeScript types and utilities
- **Authentication**: Google Sign-In via native library, exchanging credentials with existing NextAuth backend for JWT session tokens
- **Book Search**: Multi-provider search (Google Books, Hardcover, IBDB, local DB) consuming the existing `GET /api/books/search` endpoint
- **Library/Dashboard View**: Display user's book library with status filtering (Want to Read, Reading, Completed, DNF), grid layout, and sorting (by end date, start date, title, date added)
- **Add Book Wizard**: Multi-step form for adding books with status selection, format selection, acquisition method, book club, readathon, reread tracking, and date entry
- **Reading Progress Tracking**: Update current page, log reading sessions (start page, end page, duration, notes) via `POST/PATCH /api/reading-sessions` and `PATCH /api/user/books/[id]`
- **CAWPILE Rating Entry**: 7-facet rating system (Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment) on 1-10 scale with auto-computed average, adapting for fiction vs. non-fiction
- **Book Details View**: Display enriched book data from multiple providers (title, authors, description, cover, page count, categories, ISBNs) with user-specific data (status, rating, progress, sessions, review)
- **Settings/Profile Management**: Username, bio, reading goal, profile picture (S3 avatar upload), privacy controls (profileEnabled, showCurrentlyReading, showTbr)
- **Social Sharing**: Share reviews with privacy controls (show/hide dates, book clubs, readathons, review text), shareable review links
- **Public Profiles**: View other users' public profiles at their username-based URLs
- **Offline Support**: True offline capability with action queuing -- queue book additions, reading session logs, progress updates, and rating submissions while offline, then sync when connectivity returns
- **Dark Mode**: Support system-level dark/light mode preference, matching the web app's `prefers-color-scheme` behavior

### Reusability Opportunities
- Shared TypeScript types package (`src/types/book.ts`, `src/types/cawpile.ts`, `src/types/dashboard.ts`) to be extracted into a monorepo shared package
- Existing API routes consumed as-is -- no backend changes needed for mobile
- Form validation logic patterns from `src/components/forms/` components
- Search result signing utility pattern from `src/lib/search/utils/signResult.ts`
- Book type detection logic from `src/lib/bookTypeDetection.ts`
- The `video-gen` service at `services/video-gen/` already demonstrates the monorepo pattern with independent deployment

### Scope Boundaries
**In Scope:**
- Monorepo restructure (root into `apps/web/`, new `apps/mobile/`, shared packages)
- React Native (Expo) mobile app project setup
- Google Sign-In authentication (native)
- Book search consuming existing multi-provider API
- Library view with status filtering and sorting
- Add book wizard (multi-step form)
- Reading progress updates and session logging
- CAWPILE 7-facet rating entry
- Book details view
- Settings and profile management
- Social sharing and public profiles
- True offline support with action queuing
- Dark mode support
- NativeWind for styling parity with web

**Out of Scope:**
- Apple Sign-In (required before App Store submission, but not this spec)
- Analytics charts (deferred to later version)
- Admin panel (permanently web-only)
- Video recap generation and template system (deferred)
- Data export (deferred)
- Barcode/ISBN scanning (first post-MVP feature)
- App Store / Google Play Store submission and review process

### Technical Considerations
- **Monorepo tooling**: The restructure from root-level Next.js app to `apps/web/` requires careful handling of the existing `services/video-gen/` service, shared packages, and build configurations. Likely needs a monorepo tool like Turborepo or npm/pnpm workspaces
- **Authentication flow**: Mobile Google Sign-In produces an ID token that needs to be validated server-side; the existing NextAuth JWT strategy needs to accommodate mobile token exchange
- **API consumption**: All existing API routes at `src/app/api/` are consumed as-is; mobile app is a pure API client
- **Shared types**: Extract common TypeScript types into a shared workspace package to avoid duplication between web and mobile
- **Offline queue**: Needs a robust queuing mechanism (e.g., background sync, persistent queue storage) for offline actions with conflict resolution when syncing
- **Image handling**: Cover images are served via proxy (`/api/proxy/`) and S3 -- mobile needs to handle image caching and loading efficiently
- **Search result signing**: Mobile must support the existing HMAC-SHA256 signature flow for search results
- **React version**: React Native currently uses React 18.x; the web app uses React 19.1 -- the shared types package must be version-agnostic
- **Existing monorepo precedent**: The `services/video-gen/` directory already uses a separate package.json and independent deployment (Docker/EC2), demonstrating the pattern for service isolation
- **NativeWind**: Selected for styling to maintain parity with TailwindCSS 4 design tokens and dark mode approach from the web app
