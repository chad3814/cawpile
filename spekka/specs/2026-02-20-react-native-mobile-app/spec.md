# Specification: React Native Mobile App

## Goal
Build a React Native (Expo) mobile app that provides the core Cawpile book-tracking experience on iOS and Android, consuming the existing Next.js API routes, while restructuring the repository into a monorepo with shared TypeScript types.

## User Stories
- As a reader, I want to search for books, add them to my library, track my reading progress, and rate them using the CAWPILE system from my phone so that I can manage my reading on the go.
- As a reader, I want my mobile app to queue actions when I am offline and sync them when connectivity returns so that I never lose data.

## Specific Requirements

**Monorepo Restructure**
- Move existing Next.js app code into `apps/web/` -- all files from the current root (src/, prisma/, public/, next.config.ts, package.json, tsconfig.json, jest.config.ts, etc.) relocate there
- Create `apps/mobile/` for the new Expo React Native project
- Create `packages/shared/` for shared TypeScript types and pure utility functions
- Keep `services/video-gen/` at its current path (it is independently deployed and should not move)
- Use npm workspaces configured in a root-level `package.json` with `"workspaces": ["apps/*", "packages/*", "services/*"]`
- Root `package.json` scripts should proxy to workspace commands (e.g., `npm run dev -w apps/web`, `npm run dev -w apps/mobile`)
- Update `apps/web/tsconfig.json` path alias from `@/*` to `@/*` still pointing to `./src/*`, and add a reference to `packages/shared`
- Update all CI, Vercel deployment config, and `.gitignore` to account for the new structure

**Shared TypeScript Package (`packages/shared`)**
- Extract the following files from `src/types/` into `packages/shared/src/types/`: `book.ts`, `cawpile.ts`, `dashboard.ts`, `profile.ts`
- Remove all imports of `@prisma/client` enums from shared types -- instead, define standalone string union types or enums for `BookStatus` (`WANT_TO_READ | READING | COMPLETED | DNF`), `BookFormat` (`HARDCOVER | PAPERBACK | EBOOK | AUDIOBOOK`), `BookType` (`FICTION | NONFICTION`), `LibrarySortBy`, `LibrarySortOrder`, and `DashboardLayout`
- Extract pure utility functions: `calculateCawpileAverage`, `convertToStars`, `getCawpileGrade`, `getCawpileColor` (without Tailwind classes -- return semantic color names instead), `getFacetConfig`, the CAWPILE facet constant arrays (`FICTION_FACETS`, `NONFICTION_FACETS`, `RATING_SCALE_GUIDE`), and `detectBookType` with its `NON_FICTION_CATEGORIES` list
- Package should compile to ESM with TypeScript declarations, consumable by both web (React 19) and mobile (React 18) without React version dependency
- Package name: `@cawpile/shared`, referenced in workspaces as `"@cawpile/shared": "workspace:*"`
- Do NOT move any React components, hooks, or server-side code into the shared package

**Expo Project Setup (`apps/mobile`)**
- Initialize with `npx create-expo-app` using the blank TypeScript template and Expo SDK 52+
- Install core dependencies: `expo-router` (file-based routing), `nativewind` (v4, TailwindCSS 4 parity), `@tanstack/react-query` (v5), `@react-native-google-signin/google-signin`, `@react-native-async-storage/async-storage`, `expo-secure-store`, `expo-image` (for performant image loading/caching), `react-native-reanimated`, `react-native-gesture-handler`, `react-native-safe-area-context`
- Configure `nativewind` with a `tailwind.config.ts` that mirrors the web app's color tokens and dark mode support via `Appearance` API
- Set up `expo-router` with a tab-based layout as the primary navigation pattern
- Configure `app.json` / `app.config.ts` with bundle identifiers, app name "Cawpile", and required permissions

**Authentication Flow**
- Use `@react-native-google-signin/google-signin` to perform native Google Sign-In, obtaining an ID token
- Send the Google ID token to a new API endpoint `POST /api/auth/mobile` on the web backend that validates the token with Google, finds or creates the user (reusing existing `findOrCreate` patterns from `src/lib/auth-helpers.ts`), and returns a JWT session token
- This is the ONLY backend change required -- a single new API route for mobile token exchange
- Store the JWT in `expo-secure-store` (not AsyncStorage) for secure persistence
- Attach the JWT as a `Bearer` token in the `Authorization` header on all subsequent API requests
- The existing NextAuth session/cookie auth continues to work for the web app unchanged
- On app launch, check for stored JWT validity; if expired or invalid, redirect to sign-in screen
- Provide a sign-out flow that clears the stored JWT and Google Sign-In state

**API Client Layer**
- Create a centralized API client module (`apps/mobile/src/lib/api.ts`) that wraps `fetch` with: base URL configuration (pointing to the deployed web app URL), automatic JWT `Authorization` header injection, JSON content-type headers, and standardized error handling
- Base URL should be configurable via an environment variable `EXPO_PUBLIC_API_BASE_URL`
- All API calls go through this client -- never use raw `fetch` in components or hooks

**TanStack Query Setup**
- Configure a `QueryClient` with sensible defaults: 5-minute stale time, 30-minute garbage collection, retry with exponential backoff (3 retries)
- Create custom query hooks for each API endpoint, organized in `apps/mobile/src/hooks/queries/` (e.g., `useLibrary`, `useBookSearch`, `useBookDetails`, `useReadingSessions`, `useSettings`, `useProfile`, `useBookClubs`, `useReadathons`)
- Create custom mutation hooks in `apps/mobile/src/hooks/mutations/` (e.g., `useAddBook`, `useUpdateBook`, `useDeleteBook`, `useCreateReadingSession`, `useUpdateProgress`, `useSubmitRating`, `useShareReview`, `useUpdateSettings`)
- Mutations should optimistically update the query cache and roll back on error
- Use query key factories for consistent cache invalidation (e.g., `bookKeys.all`, `bookKeys.list(status)`, `bookKeys.detail(id)`)

**Offline Support and Action Queue**
- Use `@react-native-community/netinfo` to monitor network connectivity state
- When offline, mutation hooks should serialize the pending action (method, URL, body) into a persistent queue stored in AsyncStorage under a `@cawpile/offline-queue` key
- Each queued action gets a UUID, timestamp, and type identifier for deduplication
- When connectivity returns, process the queue in FIFO order with retry logic; on permanent failure (4xx), discard the action and notify the user
- Show a subtle banner or indicator in the UI when the app is offline and when queued actions are syncing
- TanStack Query's `onlineManager` should be wired to NetInfo so queries pause/resume correctly
- Queue supports these action types: add book, update book (progress, status, rating, review, tracking fields), delete book, create reading session, create/update/delete shared review, update settings

**Navigation Structure (expo-router)**
- Tab bar with 4 tabs: Library (home), Search, Profile, Settings
- Library tab: main library grid view with status filter chips at top (All, Reading, Want to Read, Completed, DNF)
- Search tab: search input with debounced results list; tapping a result opens the Add Book Wizard as a modal stack
- Profile tab: current user's public profile view (same data as `/u/[username]`)
- Settings tab: profile editing, preferences, privacy controls, sign out, account deletion
- Modal stack routes (presented over tabs): Add Book Wizard, Book Details, CAWPILE Rating, Update Progress, Log Reading Session, Share Review, Edit Book
- Book Details should be a full screen pushed onto the stack from Library (not a modal), with all book metadata, reading sessions list, rating display, and action buttons

**Library / Dashboard Screen**
- Fetch books via `GET /api/user/books` with optional `?status=` filter parameter
- Display books in a grid layout (2 columns) showing: cover image, title, author, status badge, CAWPILE average (if rated)
- Status filter chips at top: All, Reading, Want to Read, Completed, DNF -- tapping a chip re-fetches with that status filter
- Sort control matching web options: End Date, Start Date, Title, Date Added (ASC/DESC)
- Pull-to-refresh triggers query invalidation
- Empty states per tab with appropriate messaging
- Tapping a book card navigates to the Book Details screen

**Book Search Screen**
- Text input with 600ms debounce (matching `useBookSearch.ts` pattern) calling `GET /api/books/search?q=`
- Support tagged search syntax (`ibdb:`, `hard:`, `gbid:`, `isbn:`) with visual indicator when detected
- Display results in a flat list: cover thumbnail, title, authors, source badges
- Tapping a result opens the Add Book Wizard modal
- Show loading spinner during search, empty state for no results, error state on failure

**Add Book Wizard (Modal)**
- Multi-step form matching the web wizard logic in `AddBookWizard.tsx`
- Step 1: Status selection (Want to Read, Currently Reading, Completed) + Format multi-select (Hardcover, Paperback, E-book, Audiobook) -- format is required
- Step 2: Tracking fields -- Acquisition Method (picker), Book Club (text input with autocomplete from `GET /api/user/book-clubs`), Readathon (text input with autocomplete from `GET /api/user/readathons`), Reread toggle
- Step 3 (Reading/Completed only): Start date picker
- Step 4 (Reading only): Progress percentage input; (Completed only): Did you finish? (Yes/No) with finish date or DNF date picker
- Step count varies by status: Want to Read = 2 steps, Reading/Completed = 4 steps
- Progress bar at top showing current step
- Submit sends `POST /api/user/books` with the `signedResult` from search (signature is included in search results and validated server-side)
- On success, invalidate library query cache and navigate back

**Book Details Screen**
- Full-screen view displaying: cover image (large), title, subtitle, authors, description (expandable), page count, categories, ISBNs, published date
- User-specific section: status badge, format badges, start/finish dates, progress bar (for Reading status), current page
- Tracking details: acquisition method, book club, readathon, reread status, diversity fields
- CAWPILE rating display: facet breakdown with colored bars (reusing `getCawpileGrade` and score display logic from shared package), average score, star rating
- Review text (if present)
- Reading sessions list (fetched via `GET /api/reading-sessions?userBookId=`)
- Action buttons: Update Progress, Log Reading Session, Rate (CAWPILE), Write Review, Share, Edit, Delete
- Delete requires confirmation alert dialog

**CAWPILE Rating Screen (Modal)**
- Swipeable card interface -- one facet per card, 7 total (adapting fiction vs. nonfiction facets from `FICTION_FACETS` / `NONFICTION_FACETS` in shared package)
- Each card shows: facet name, description, guiding questions list, slider (1-10), current value display
- Navigation: Previous / Next buttons, Skip Facet option, Jump to Summary
- Summary screen at end: all 7 facets listed with scores, computed average, letter grade, star rating
- Submit via `PATCH /api/user/books/[id]` with `cawpileRating` object in body
- Support editing existing ratings (pre-populate slider values from existing data)

**Reading Progress and Session Logging**
- Update Progress modal: percentage slider or page number input, submits `PATCH /api/user/books/[id]` with `{ progress, currentPage }`
- Log Reading Session modal: start page, end page, duration (minutes, optional), notes (optional text area), submits `POST /api/reading-sessions`
- Both modals invalidate relevant query caches on success

**Settings and Profile Management Screen**
- Profile section: name, username (with availability check via `GET /api/user/username-check?username=`), bio (textarea, 500 char limit)
- Avatar: display current avatar, upload new one via presigned URL flow (`GET /api/user/avatar/presigned-url` then PUT to S3 then `POST /api/user/avatar`)
- Reading goal: number input (1-500)
- Privacy toggles: Profile Enabled, Show Currently Reading, Show TBR
- Account section: email display (read-only), sign out button, delete account button (with confirmation flow matching `DeleteAccountModal` behavior -- calls `DELETE /api/user`)
- All fields save via `PATCH /api/user/settings`

**Social Sharing**
- Share Review modal accessible from Book Details on completed+rated books
- Privacy toggles: show dates, show book clubs, show readathons, show review text
- Creates/updates share via `POST /api/user/books/[id]/share` or `PATCH /api/user/books/[id]/share`
- Generates a share URL and offers native share sheet (React Native `Share` API) with the URL
- Delete share option via `DELETE /api/user/books/[id]/share`

**Public Profiles**
- View other users' public profiles by navigating to a profile screen with a username parameter
- Fetches data via `GET /api/profile/[username]`
- Displays: avatar, name, username, bio, currently reading books (if enabled), shared reviews, TBR (if enabled)
- Read-only view, no editing capabilities on other users' profiles

**Dark Mode**
- Follow system appearance preference using React Native's `Appearance` API
- NativeWind's dark mode class strategy should be configured to respond to system setting
- All screens must be designed for both light and dark themes
- Color tokens should match the web app's CSS custom properties defined in `globals.css`

**Image Handling**
- Use `expo-image` for all book cover images -- it provides built-in disk caching, progressive loading, and placeholder support
- Cover images are served via the existing `/api/proxy/` endpoint or directly from provider URLs (Google Books, S3)
- Avatar images load from S3 URLs or Google OAuth fallback URL
- Configure appropriate cache policies: covers cached for 7 days, avatars cached for 1 day

## Visual Design
No visual assets were provided. The mobile app should follow the web app's existing design language: clean card-based layouts, the same color palette (primary blue, semantic status colors), consistent typography scale, and the same dark/light mode treatment. Specific screen layouts should be adapted for mobile conventions (bottom tab bar, full-screen detail views, bottom sheet modals, native-feeling gesture interactions).

## Existing Code to Leverage

**TypeScript Types (`src/types/book.ts`, `src/types/cawpile.ts`, `src/types/dashboard.ts`, `src/types/profile.ts`)**
- These files define all interfaces for API request/response shapes used throughout the app
- Extract into `packages/shared/` with Prisma enum imports replaced by standalone type definitions
- Mobile app imports these types to ensure type-safe API consumption without drift

**CAWPILE Rating Logic (`src/types/cawpile.ts`)**
- Contains `FICTION_FACETS`, `NONFICTION_FACETS`, `RATING_SCALE_GUIDE` constants, `calculateCawpileAverage`, `convertToStars`, `getCawpileGrade`, and `getFacetConfig`
- All are pure functions with no React or DOM dependencies -- extract directly into shared package
- Mobile rating screen should consume these to render facet cards and compute averages identically to web

**Add Book Wizard (`src/components/modals/AddBookWizard.tsx`)**
- Defines the multi-step form flow: step count logic based on status, form data shape (`BookFormData`), date defaulting logic, and the `POST /api/user/books` submission payload structure including `signedResult`
- Mobile wizard must replicate this exact step logic and API payload format

**API Routes (`src/app/api/`)**
- `GET /api/books/search` -- search with `?q=` and optional `?limit=`, returns `{ books: SignedBookSearchResult[], taggedSearch: boolean }`
- `GET/POST /api/user/books` -- library fetch (with `?status=`, `?limit=`, `?offset=`) and book creation
- `PATCH/DELETE /api/user/books/[id]` -- update (progress, status, rating, all tracking fields, cover preference) and delete
- `POST/GET /api/reading-sessions` -- create session and list sessions for a book
- `GET/PATCH /api/user/settings` -- fetch and update user profile/preferences
- `GET/POST/PATCH/DELETE /api/user/books/[id]/share` -- shared review CRUD
- `GET /api/user/book-clubs`, `GET /api/user/readathons` -- autocomplete data
- `GET /api/user/username-check?username=` -- username availability
- `GET/POST /api/user/avatar/*` -- avatar upload flow
- `GET /api/profile/[username]` -- public profile data
- `GET /api/share/reviews/[shareToken]` -- public shared review data

**Book Type Detection (`src/lib/bookTypeDetection.ts`)**
- Pure function `detectBookType(categories)` with no external dependencies beyond the `BookType` enum
- Extract into shared package for use in mobile app when displaying fiction/nonfiction-appropriate rating facets

## Out of Scope
- Apple Sign-In (required before App Store submission but not part of this spec)
- Analytics charts and the Charts tab (deferred to a later mobile version)
- Admin panel and all admin API routes (permanently web-only, never in mobile)
- Video recap generation and the template system (deferred)
- Data export / CSV download functionality (deferred)
- Barcode or ISBN scanning (planned as first post-MVP feature)
- App Store and Google Play Store submission, review, and listing
- Push notifications or background sync beyond the offline action queue
- Deep linking / universal links configuration
- Migrating `services/video-gen/` into the workspaces structure or changing its deployment
- Any changes to existing API route behavior or response shapes (mobile consumes as-is, except the new `POST /api/auth/mobile` endpoint)
