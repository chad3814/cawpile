# Task Breakdown: React Native Mobile App

## Overview
Total Tasks: 12 Task Groups, ~85 sub-tasks

This spec covers restructuring the Cawpile repository into a monorepo, extracting shared TypeScript types and utilities into a shared package, building a React Native (Expo) mobile app with full offline support, and adding a single new backend API endpoint for mobile authentication.

## Task List

---

### Phase 1: Monorepo Foundation

#### Task Group 1: Monorepo Restructure
**Dependencies:** None

- [x] 1.0 Complete monorepo restructure
  - [x] 1.1 Write 4 focused tests for monorepo integrity
    - Test that `packages/shared` compiles and exports types correctly
    - Test that `apps/web` can import from `@cawpile/shared`
    - Test that `apps/web` TypeScript compilation succeeds with new path references
    - Test that root workspace commands proxy correctly to sub-packages
  - [x] 1.2 Create root-level `package.json` with npm workspaces
    - Set `"workspaces": ["apps/*", "packages/*", "services/*"]`
    - Add proxy scripts: `npm run dev -w apps/web`, `npm run dev -w apps/mobile`, `npm run test -w apps/web`, `npm run lint -w apps/web`
    - Remove all direct dependencies from root (they belong in workspace packages)
  - [x] 1.3 Move existing Next.js app into `apps/web/`
    - Relocate: `src/`, `prisma/`, `public/`, `__tests__/`, `__mocks__/`, `scripts/`, `.env.example`
    - Relocate config files: `next.config.ts`, `tsconfig.json`, `jest.config.ts`, `jest.setup.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `prisma.config.js`
    - Relocate the web app's `package.json` (with all current dependencies/devDependencies)
    - Keep `services/video-gen/` at its current path unchanged
    - Keep `.github/`, `.gitignore`, `CLAUDE.md`, `docs/`, `claudedocs/`, `spekka/` at root level
  - [x] 1.4 Update `apps/web/tsconfig.json` path aliases
    - Ensure `@/*` still points to `./src/*`
    - Add TypeScript project reference to `packages/shared`
    - Verify all existing `@/` imports in `src/` continue to resolve
  - [x] 1.5 Update `apps/web/package.json` to depend on `@cawpile/shared`
    - Add `"@cawpile/shared": "*"` to dependencies (npm workspace syntax)
    - Verify `prisma generate` and `next build` scripts still work from `apps/web/`
  - [x] 1.6 Update `.gitignore` for new monorepo structure
    - Add `apps/*/node_modules`, `packages/*/node_modules`, `packages/*/dist/`
    - Verify `services/video-gen/` ignore rules still apply
  - [x] 1.7 Update CI and Vercel deployment configuration
    - Update `.github/` workflow paths if applicable
    - Set Vercel root directory to `apps/web/` or configure build commands appropriately
    - Ensure root `npm install` installs all workspaces
  - [x] 1.8 Update `CLAUDE.md` to reflect new monorepo structure
    - Document new directory layout, workspace commands, and shared package usage
  - [x] 1.9 Ensure monorepo integrity tests pass
    - Run the 4 tests from 1.1
    - Verify `npm install` from root installs all workspace dependencies
    - Verify `npm run build -w apps/web` succeeds
    - Verify `npm run test -w apps/web` runs existing test suite successfully
    - Verify `npm run test -w services/video-gen` still works

**Acceptance Criteria:**
- All existing web app tests pass from `apps/web/`
- `npm install` at root installs all workspaces
- `npm run build -w apps/web` produces a working build
- `services/video-gen/` is unaffected and its tests still pass
- No broken imports in the web app after relocation

---

#### Task Group 2: Shared TypeScript Package (`packages/shared`)
**Dependencies:** Task Group 1

- [x] 2.0 Complete shared package extraction
  - [x] 2.1 Write 6 focused tests for shared package
    - Test `calculateCawpileAverage` returns correct average with mixed null/number values
    - Test `convertToStars` maps boundary values correctly (1.0, 2.2, 4.5, 6.9, 8.9, 10)
    - Test `getCawpileGrade` returns correct letter grade for boundary values
    - Test `getFacetConfig` returns fiction facets for FICTION and nonfiction facets for NONFICTION
    - Test `detectBookType` returns FICTION for fiction categories and NONFICTION for non-fiction categories
    - Test that all exported types compile without errors (type-level test via `tsc --noEmit`)
  - [x] 2.2 Initialize `packages/shared/` package structure
    - Create `package.json` with name `@cawpile/shared`, `"type": "module"`, `"main": "dist/index.js"`, `"types": "dist/index.d.ts"`
    - Create `tsconfig.json` targeting ESM output with declaration files
    - Set up build script using `tsc` to compile to `dist/`
    - Ensure no React dependency -- package must be pure TypeScript
  - [x] 2.3 Extract and adapt type files from `src/types/`
    - Copy `book.ts`, `cawpile.ts`, `dashboard.ts`, `profile.ts` into `packages/shared/src/types/`
    - Replace all `import { BookStatus, BookFormat } from '@prisma/client'` with standalone string union types:
      - `type BookStatus = 'WANT_TO_READ' | 'READING' | 'COMPLETED' | 'DNF'`
      - `type BookFormat = 'HARDCOVER' | 'PAPERBACK' | 'EBOOK' | 'AUDIOBOOK'`
      - `type BookType = 'FICTION' | 'NONFICTION'`
    - Add `DashboardLayout`, `LibrarySortBy`, `LibrarySortOrder` string union types
    - Verify no remaining `@prisma/client` imports
  - [x] 2.4 Extract CAWPILE utility functions into shared package
    - Move to `packages/shared/src/utils/cawpile.ts`: `calculateCawpileAverage`, `convertToStars`, `getCawpileGrade`, `getFacetConfig`
    - Move constants: `FICTION_FACETS`, `NONFICTION_FACETS`, `RATING_SCALE_GUIDE`
    - Adapt `getCawpileColor` to return semantic color names (`'green' | 'yellow' | 'orange' | 'red'`) instead of Tailwind class strings
    - Keep `getStarEmojis` in the web app only (emoji rendering differs on native)
  - [x] 2.5 Extract book type detection into shared package
    - Move `detectBookType` and `isNonFictionCategory` to `packages/shared/src/utils/bookType.ts`
    - Move `NON_FICTION_CATEGORIES` constant array
    - Replace `import { BookType } from '@prisma/client'` with the shared `BookType` union type
  - [x] 2.6 Create barrel exports in `packages/shared/src/index.ts`
    - Export all types from `types/` directory
    - Export all utility functions and constants from `utils/` directory
    - Verify clean compilation with `npm run build -w packages/shared`
  - [x] 2.7 Update `apps/web/` to import from `@cawpile/shared`
    - Replace imports in `src/types/cawpile.ts` -- re-export from shared package or remove duplicates
    - Replace imports in `src/types/dashboard.ts` and `src/types/profile.ts`
    - Replace imports in `src/lib/bookTypeDetection.ts` -- proxy to shared or replace entirely
    - Update any component importing `FICTION_FACETS`, `calculateCawpileAverage`, etc. to use `@cawpile/shared`
    - Keep web-specific types (e.g., `video-template.ts`, `admin.ts`, `next-auth.d.ts`) in `apps/web/src/types/`
  - [x] 2.8 Ensure shared package tests pass
    - Run the 6 tests from 2.1
    - Verify `npm run build -w packages/shared` produces valid ESM output with declarations
    - Verify `apps/web/` still compiles and its tests pass after import migration

**Acceptance Criteria:**
- The 6 shared package tests pass
- `packages/shared` compiles to ESM with `.d.ts` declarations
- No `@prisma/client` imports remain in shared package
- `apps/web/` imports from `@cawpile/shared` and all existing tests still pass
- Package contains zero React dependencies

---

### Phase 2: Backend (Single Endpoint)

#### Task Group 3: Mobile Authentication Endpoint
**Dependencies:** Task Group 1 (monorepo restructure must be complete so `apps/web/` path is correct)

- [x] 3.0 Complete mobile auth endpoint
  - [x] 3.1 Write 5 focused tests for `POST /api/auth/mobile`
    - Test successful token exchange: valid Google ID token returns JWT and user data
    - Test invalid/expired Google ID token returns 401
    - Test missing `idToken` in request body returns 400
    - Test that a new user is created on first sign-in (find-or-create behavior)
    - Test that an existing user is returned on subsequent sign-ins
  - [x] 3.2 Create `apps/web/src/app/api/auth/mobile/route.ts`
    - Accept `POST` with JSON body `{ idToken: string }`
    - Validate the Google ID token by calling Google's tokeninfo endpoint (`https://oauth2.googleapis.com/tokeninfo?id_token=`) or using the `google-auth-library` package
    - Extract `sub` (Google user ID), `email`, `name`, and `picture` from the validated token
    - Find or create the user using Prisma: look up by Google Account `providerAccountId`, or create User + Account records (reuse pattern from NextAuth Prisma Adapter)
    - Generate a JWT containing `{ userId, email, name, image, isAdmin, isSuperAdmin }` signed with `NEXTAUTH_SECRET`
    - Return `{ token: string, user: { id, email, name, image } }`
  - [x] 3.3 Create JWT utility functions for mobile auth
    - `generateMobileJwt(user)` -- creates a signed JWT with 30-day expiry using `NEXTAUTH_SECRET`
    - `verifyMobileJwt(token)` -- verifies and decodes the JWT, returns user payload or throws
    - Place in `apps/web/src/lib/auth/mobile-jwt.ts`
  - [x] 3.4 Create mobile auth middleware helper
    - `getMobileUser(request: Request)` -- extracts Bearer token from Authorization header, verifies JWT, fetches user from database
    - Place in `apps/web/src/lib/auth/mobile-auth.ts`
    - This helper will be used by existing API routes to support both cookie-based (web) and JWT-based (mobile) auth
  - [x] 3.5 Update existing API route auth to support mobile JWT
    - Modify `getCurrentUser()` in `apps/web/src/lib/auth-helpers.ts` to check for Bearer token in Authorization header as a fallback when no NextAuth session exists
    - If Bearer token is present, use `verifyMobileJwt` to authenticate
    - Existing cookie-based auth remains the primary path for web -- JWT is only checked when no session cookie is found
    - This allows ALL existing API routes to work for mobile without per-route changes
  - [x] 3.6 Ensure mobile auth tests pass
    - Run the 5 tests from 3.1
    - Verify existing auth-related tests still pass (no regression in web auth flow)

**Acceptance Criteria:**
- The 5 mobile auth tests pass
- `POST /api/auth/mobile` accepts a Google ID token and returns a JWT
- Existing API routes accept Bearer token auth in addition to cookie auth
- No changes to web app authentication behavior
- All existing web auth tests pass (no regression)

---

### Phase 3: Mobile App Foundation

#### Task Group 4: Expo Project Setup
**Dependencies:** Task Group 1 (workspace structure), Task Group 2 (shared package available)

- [x] 4.0 Complete Expo project initialization
  - [x] 4.1 Write 3 focused tests for project setup validation
    - Test that the app entry point renders without crashing
    - Test that `@cawpile/shared` types are importable and usable
    - Test that the API client module initializes with correct base URL
  - [x] 4.2 Initialize Expo project in `apps/mobile/`
    - Run `npx create-expo-app apps/mobile --template blank-typescript` (Expo SDK 52+)
    - Configure `app.config.ts` with bundle identifiers (`com.cawpile.mobile`), app name "Cawpile", required permissions
    - Add `@cawpile/shared` as a workspace dependency
  - [x] 4.3 Install core dependencies
    - Navigation: `expo-router`, `react-native-safe-area-context`, `react-native-screens`
    - Styling: `nativewind` (v4), `tailwindcss`
    - Data: `@tanstack/react-query` (v5), `@react-native-async-storage/async-storage`
    - Auth: `@react-native-google-signin/google-signin`, `expo-secure-store`
    - Images: `expo-image`
    - Animations: `react-native-reanimated`, `react-native-gesture-handler`
    - Network: `@react-native-community/netinfo`
  - [x] 4.4 Configure NativeWind with dark mode support
    - Create `tailwind.config.ts` mirroring web app color tokens (primary blue, semantic status colors, green/yellow/orange/red rating colors)
    - Configure dark mode via `Appearance` API (class strategy responsive to system setting)
    - Set up `global.css` with base styles matching web app design language
  - [x] 4.5 Configure `expo-router` with tab-based layout
    - Create `app/_layout.tsx` as root layout with providers (QueryClient, Auth, SafeArea)
    - Create `app/(tabs)/_layout.tsx` with 4-tab bottom navigation: Library, Search, Profile, Settings
    - Create placeholder screens for each tab
    - Create `app/(modals)/_layout.tsx` for modal stack routes
  - [x] 4.6 Set up TypeScript configuration
    - Configure `tsconfig.json` with path alias `@/` pointing to `./src/`
    - Add project reference to `packages/shared`
    - Configure strict mode matching the web app's settings
  - [x] 4.7 Ensure project setup tests pass
    - Run the 3 tests from 4.1
    - Verify NativeWind styles apply correctly in a test component

**Acceptance Criteria:**
- The 3 setup tests pass
- Tab navigation renders with 4 tabs and placeholder screens
- NativeWind styles apply correctly in both light and dark mode
- `@cawpile/shared` types are importable from mobile code

---

#### Task Group 5: API Client, Authentication, and Offline Infrastructure
**Dependencies:** Task Group 3 (mobile auth endpoint exists), Task Group 4 (Expo project set up)

- [x] 5.0 Complete API client and auth infrastructure
  - [x] 5.1 Write 8 focused tests for API client and auth
    - Test API client attaches JWT to Authorization header on requests
    - Test API client reads base URL from `EXPO_PUBLIC_API_BASE_URL`
    - Test API client handles 401 by clearing auth state and redirecting to sign-in
    - Test Google Sign-In flow stores JWT in secure store on success
    - Test sign-out clears JWT from secure store and Google sign-in state
    - Test offline queue serializes a mutation to AsyncStorage when offline
    - Test offline queue processes actions in FIFO order when connectivity returns
    - Test offline queue discards actions on 4xx response and notifies user
  - [x] 5.2 Create API client module (`apps/mobile/src/lib/api.ts`)
    - Wrap `fetch` with base URL from `EXPO_PUBLIC_API_BASE_URL` environment variable
    - Automatically inject JWT as `Bearer` token in `Authorization` header (read from secure store)
    - Set `Content-Type: application/json` on all requests
    - Standardized error handling: parse error responses, throw typed errors
    - Export typed helper methods: `api.get<T>(path)`, `api.post<T>(path, body)`, `api.patch<T>(path, body)`, `api.delete(path)`
  - [x] 5.3 Implement authentication flow
    - Create `apps/mobile/src/lib/auth.ts` with `signIn()`, `signOut()`, `getStoredToken()`, `isAuthenticated()`
    - `signIn()`: trigger `@react-native-google-signin/google-signin`, obtain ID token, call `POST /api/auth/mobile`, store returned JWT in `expo-secure-store`
    - `signOut()`: clear JWT from secure store, clear Google Sign-In state, clear TanStack Query cache
    - `getStoredToken()`: read JWT from secure store, validate expiry client-side
    - Create auth context (`apps/mobile/src/contexts/AuthContext.tsx`) providing `user`, `isAuthenticated`, `isLoading`, `signIn`, `signOut`
  - [x] 5.4 Create sign-in screen
    - Create `app/sign-in.tsx` as an unauthenticated route
    - Display app logo/branding, "Sign in with Google" button
    - On success, navigate to main tab layout
    - On error, display error message with retry option
  - [x] 5.5 Implement auth guard for protected routes
    - In root layout, check auth state on app launch
    - If no valid JWT, redirect to sign-in screen
    - If valid JWT, proceed to tab layout
    - Handle token expiry mid-session (401 from API triggers re-auth)
  - [x] 5.6 Configure TanStack Query
    - Create `apps/mobile/src/lib/queryClient.ts` with `QueryClient` configuration
    - Defaults: 5-minute stale time, 30-minute garbage collection, 3 retries with exponential backoff
    - Wire `onlineManager` to `@react-native-community/netinfo` so queries pause when offline
    - Wrap app in `QueryClientProvider` in root layout
  - [x] 5.7 Create query key factory (`apps/mobile/src/lib/queryKeys.ts`)
    - `bookKeys`: `all`, `lists()`, `list(status)`, `detail(id)`, `search(query)`
    - `sessionKeys`: `all`, `forBook(userBookId)`
    - `userKeys`: `settings()`, `profile()`, `bookClubs()`, `readathons()`, `usernameCheck(username)`
    - `profileKeys`: `byUsername(username)`
  - [x] 5.8 Implement offline action queue
    - Create `apps/mobile/src/lib/offlineQueue.ts`
    - Queue storage in AsyncStorage under `@cawpile/offline-queue` key
    - Each action: `{ id: UUID, type: string, method: string, url: string, body: object, timestamp: number }`
    - `enqueue(action)`: add to persistent queue
    - `processQueue()`: on connectivity restored, process FIFO with retry; discard on 4xx, retry on 5xx
    - Deduplication by action type + resource ID (e.g., only keep latest progress update for same book)
    - Wire to NetInfo `addEventListener` to trigger processing on reconnect
  - [x] 5.9 Create offline status UI components
    - `OfflineBanner` component: subtle banner displayed when app is offline
    - `SyncIndicator` component: shows when queued actions are being processed
    - Integrate into root layout so they appear across all screens
  - [x] 5.10 Ensure API client and auth tests pass
    - Run the 8 tests from 5.1
    - Verify offline queue persists across app restarts (AsyncStorage)

**Acceptance Criteria:**
- The 8 tests pass
- Google Sign-In obtains a JWT and stores it securely
- All API calls include the JWT in the Authorization header
- Sign-out clears all auth state
- Offline queue persists mutations and replays them on reconnect
- TanStack Query pauses/resumes with network state
- Offline banner appears when device loses connectivity

---

### Phase 4: Core Mobile Screens

#### Task Group 6: Library / Dashboard Screen
**Dependencies:** Task Group 5 (API client, auth, and query infrastructure)

- [x] 6.0 Complete Library screen
  - [x] 6.1 Write 5 focused tests for Library screen
    - Test library fetches and displays books from `GET /api/user/books`
    - Test status filter chips filter the displayed books (re-fetches with `?status=` param)
    - Test pull-to-refresh triggers query invalidation and re-fetch
    - Test tapping a book card navigates to Book Details screen
    - Test empty state renders appropriate messaging per status filter
  - [x] 6.2 Create query and mutation hooks for library
    - `useLibrary(status?)` query hook: `GET /api/user/books` with optional `?status=` filter, returns `DashboardBookData[]`
    - `useDeleteBook()` mutation hook: `DELETE /api/user/books/[id]` with optimistic cache removal
    - Place in `apps/mobile/src/hooks/queries/useLibrary.ts` and `apps/mobile/src/hooks/mutations/useDeleteBook.ts`
  - [x] 6.3 Build BookCard component
    - Display: cover image (via `expo-image` with 7-day cache), title, author, status badge, CAWPILE average (if rated)
    - Use `getCawpileGrade` and `getCawpileColor` from `@cawpile/shared` for rating display
    - Resolve cover image URL from provider priority: `preferredCoverProvider` > hardcoverBook > googleBook > ibdbBook
    - Placeholder image for books without covers
    - Dark mode support via NativeWind
  - [x] 6.4 Build Library screen (`app/(tabs)/library.tsx`)
    - Status filter chips at top: All, Reading, Want to Read, Completed, DNF (horizontally scrollable)
    - 2-column grid layout using `FlatList` with `numColumns={2}`
    - Sort control: End Date, Start Date, Title, Date Added with ASC/DESC toggle
    - Pull-to-refresh via `RefreshControl` wired to query invalidation
    - Tapping a BookCard navigates to Book Details (push onto stack, not modal)
    - Loading skeleton state while fetching
    - Empty states per status filter with contextual messaging
  - [x] 6.5 Ensure Library screen tests pass
    - Run the 5 tests from 6.1

**Acceptance Criteria:**
- The 5 Library tests pass
- Books display in a 2-column grid with cover, title, author, status, and rating
- Status filter chips correctly filter the library
- Pull-to-refresh re-fetches data
- Tapping a book navigates to Book Details
- Empty states display for each filter when no books match

---

#### Task Group 7: Book Search and Add Book Wizard
**Dependencies:** Task Group 5 (API client), Task Group 6 (Library query hooks for cache invalidation)

- [x] 7.0 Complete Search and Add Book flow
  - [x] 7.1 Write 6 focused tests for Search and Add Book
    - Test search input debounces at 600ms and calls `GET /api/books/search?q=`
    - Test tagged search syntax (`ibdb:`, `hard:`, `gbid:`, `isbn:`) shows visual indicator
    - Test search results display title, authors, source badges, and cover thumbnail
    - Test tapping a search result opens the Add Book Wizard modal
    - Test wizard step count varies by status: Want to Read = 2, Reading/Completed = 4
    - Test wizard submission calls `POST /api/user/books` with `signedResult` and invalidates library cache
  - [x] 7.2 Create search query hook
    - `useBookSearch(query)` in `apps/mobile/src/hooks/queries/useBookSearch.ts`
    - Calls `GET /api/books/search?q=` with 600ms debounce (use `useDebounce` hook)
    - Returns `{ books: SignedBookSearchResult[], taggedSearch: boolean }`
    - Disabled when query is empty
  - [x] 7.3 Create `useDebounce` hook
    - `apps/mobile/src/hooks/useDebounce.ts`
    - Generic debounce hook matching pattern from web app's `src/hooks/useDebounce.ts`
    - Default delay: 600ms
  - [x] 7.4 Build Search screen (`app/(tabs)/search.tsx`)
    - Text input with search icon, 600ms debounce
    - Tagged search detection: display visual badge when `ibdb:`, `hard:`, `gbid:`, `isbn:` prefix detected
    - Results displayed in `FlatList`: cover thumbnail (small), title, authors, source provider badges
    - Loading spinner during search
    - Empty state for no results ("No books found")
    - Error state on API failure with retry
    - Tapping a result opens Add Book Wizard modal with the selected book's `signedResult`
  - [x] 7.5 Create autocomplete hooks for wizard
    - `useBookClubs()`: `GET /api/user/book-clubs`, returns list for autocomplete
    - `useReadathons()`: `GET /api/user/readathons`, returns list for autocomplete
    - Place in `apps/mobile/src/hooks/queries/`
  - [x] 7.6 Create `useAddBook` mutation hook
    - `apps/mobile/src/hooks/mutations/useAddBook.ts`
    - Calls `POST /api/user/books` with the form data + `signedResult`
    - On success: invalidate library query cache, close modal, navigate to library
    - On offline: enqueue to offline action queue
    - Optimistic update: add book to library cache immediately
  - [x] 7.7 Build Add Book Wizard modal (`app/(modals)/add-book.tsx`)
    - Multi-step form presented as a modal stack over tabs
    - Progress bar at top showing current step / total steps
    - Step 1 (all statuses): Status selection (Want to Read, Currently Reading, Completed) + Format multi-select (required)
    - Step 2 (all statuses): Tracking fields -- Acquisition Method (picker), Book Club (text input with autocomplete), Readathon (text input with autocomplete), Reread toggle
    - Step 3 (Reading/Completed only): Start date picker (defaults to today)
    - Step 4 (Reading only): Progress percentage input; (Completed only): Did you finish? (Yes/No) with finish date or DNF date picker
    - Step count logic: Want to Read = 2 steps, Reading = 4 steps, Completed = 4 steps
    - Back/Next navigation buttons, Submit on final step
    - Form validation: format is required on Step 1
    - Submission includes `signedResult` from search (passed as route param)
  - [x] 7.8 Ensure Search and Add Book tests pass
    - Run the 6 tests from 7.1

**Acceptance Criteria:**
- The 6 tests pass
- Search debounces input and displays results from API
- Tagged search syntax is detected and indicated visually
- Add Book Wizard has correct step count per status
- Format selection is required
- Submission succeeds and library cache is invalidated
- Wizard works offline (mutation queued)

---

#### Task Group 8: Book Details Screen
**Dependencies:** Task Group 6 (Library screen navigates here), Task Group 5 (API client)

- [x] 8.0 Complete Book Details screen
  - [x] 8.1 Write 5 focused tests for Book Details
    - Test book metadata displays correctly (title, authors, description, page count, ISBNs, categories)
    - Test user-specific data renders (status badge, format badges, progress bar, dates)
    - Test CAWPILE rating display shows facet breakdown with colored bars and average
    - Test reading sessions list fetches and displays via `GET /api/reading-sessions?userBookId=`
    - Test delete action shows confirmation dialog and calls `DELETE /api/user/books/[id]`
  - [x] 8.2 Create query hooks for Book Details
    - `useBookDetails(id)` -- uses library cache data (no separate endpoint needed, data is in `DashboardBookData`)
    - `useReadingSessions(userBookId)` -- `GET /api/reading-sessions?userBookId=`, returns sessions list
    - Place in `apps/mobile/src/hooks/queries/`
  - [x] 8.3 Build Book Details screen (`app/book/[id].tsx`)
    - Full-screen view pushed onto navigation stack (not a modal)
    - **Book metadata section**: Large cover image, title, subtitle, authors, expandable description (collapsed to 3 lines with "Show more"), page count, categories as chips, ISBNs, published date
    - **User data section**: Status badge (colored), format badges, start date, finish date, progress bar (for Reading status with percentage), current page display
    - **Tracking section**: Acquisition method, book club, readathon, reread status, diversity fields (LGBTQ, disability, new author, POC)
    - **CAWPILE rating section**: If rated -- facet breakdown with colored horizontal bars (color from shared `getCawpileColor`), numeric scores, average, letter grade (from `getCawpileGrade`), star rating (from `convertToStars`)
    - **Review section**: Display review text if present
    - **Reading sessions section**: List of sessions with date, pages read, duration, notes
    - **Action buttons**: Update Progress, Log Session, Rate (CAWPILE), Write Review, Share, Edit, Delete
    - Delete button triggers native `Alert.alert` confirmation dialog
  - [x] 8.4 Ensure Book Details tests pass
    - Run the 5 tests from 8.1

**Acceptance Criteria:**
- The 5 tests pass
- All book metadata and user data display correctly
- CAWPILE rating shows facet breakdown with correct colors and grades
- Reading sessions list loads and displays
- Action buttons navigate to appropriate modals
- Delete shows confirmation and removes book from library

---

#### Task Group 9: CAWPILE Rating and Reading Sessions
**Dependencies:** Task Group 8 (Book Details provides navigation to these modals), Task Group 2 (shared CAWPILE utilities)

- [x] 9.0 Complete rating and session screens
  - [x] 9.1 Write 6 focused tests for rating and session features
    - Test CAWPILE rating screen renders correct facets for fiction vs. nonfiction books (using shared `getFacetConfig`)
    - Test slider updates value for each facet and displays current score
    - Test rating summary computes correct average (using shared `calculateCawpileAverage`)
    - Test rating submission calls `PATCH /api/user/books/[id]` with `cawpileRating` object
    - Test Update Progress modal submits percentage and page number via `PATCH /api/user/books/[id]`
    - Test Log Reading Session modal submits via `POST /api/reading-sessions`
  - [x] 9.2 Create mutation hooks for rating and sessions
    - `useSubmitRating(bookId)` -- `PATCH /api/user/books/[id]` with `{ cawpileRating }`, invalidates book detail cache
    - `useUpdateProgress(bookId)` -- `PATCH /api/user/books/[id]` with `{ progress, currentPage }`, optimistic update
    - `useCreateReadingSession()` -- `POST /api/reading-sessions`, invalidates sessions cache
    - Place in `apps/mobile/src/hooks/mutations/`
    - All support offline queueing
  - [x] 9.3 Build CAWPILE Rating screen (`app/(modals)/rate-book.tsx`)
    - Swipeable card interface using `react-native-gesture-handler` and `react-native-reanimated`
    - One card per facet, 7 total -- facets from `getFacetConfig(bookType)` via `@cawpile/shared`
    - Each card: facet name, description, guiding questions list, slider (1-10 range), current value display
    - Navigation: Previous / Next buttons, Skip Facet option (sets value to null), Jump to Summary button
    - Animation: smooth horizontal swipe transition between cards
    - Summary card at end: all 7 facets with scores (or "Skipped"), computed average (from `calculateCawpileAverage`), letter grade (from `getCawpileGrade`), star rating (from `convertToStars`)
    - Submit button on summary card
    - Pre-populate slider values when editing existing ratings
  - [x] 9.4 Build Update Progress modal (`app/(modals)/update-progress.tsx`)
    - Percentage slider (0-100%) with numeric display
    - Page number text input (optional, numeric keyboard)
    - Current values pre-populated from book data
    - Submit calls `useUpdateProgress` mutation
    - On success: invalidate queries, close modal
  - [x] 9.5 Build Log Reading Session modal (`app/(modals)/log-session.tsx`)
    - Fields: Start page (number input), End page (number input), Duration in minutes (optional number input), Notes (optional text area)
    - Validation: end page must be greater than start page
    - Submit calls `useCreateReadingSession` mutation
    - On success: invalidate sessions query, close modal
  - [x] 9.6 Ensure rating and session tests pass
    - Run the 6 tests from 9.1

**Acceptance Criteria:**
- The 6 tests pass
- CAWPILE rating screen shows correct facets for fiction vs. nonfiction
- Swipeable card navigation works smoothly
- Summary displays correct computed average and grade
- Rating submission works and updates Book Details
- Progress update persists and shows on Book Details
- Reading session creation appears in Book Details session list
- All mutations work offline (queued)

---

#### Task Group 10: Settings, Profile, and Social Sharing
**Dependencies:** Task Group 5 (API client and auth), Task Group 8 (Book Details for share action)

- [x] 10.0 Complete settings, profile, and sharing screens
  - [x] 10.1 Write 7 focused tests for settings, profile, and sharing
    - Test settings screen loads current user data via `GET /api/user/settings`
    - Test username availability check debounces and calls `GET /api/user/username-check?username=`
    - Test settings save calls `PATCH /api/user/settings` with updated fields
    - Test sign-out clears auth state and navigates to sign-in screen
    - Test public profile screen fetches and displays data via `GET /api/profile/[username]`
    - Test Share Review modal creates share via `POST /api/user/books/[id]/share` and opens native share sheet
    - Test delete account flow shows confirmation and calls `DELETE /api/user`
  - [x] 10.2 Create query and mutation hooks for settings and profile
    - `useSettings()` query hook: `GET /api/user/settings`
    - `useUpdateSettings()` mutation: `PATCH /api/user/settings`
    - `useUsernameCheck(username)` query hook: `GET /api/user/username-check?username=` with 500ms debounce
    - `usePublicProfile(username)` query hook: `GET /api/profile/[username]`
    - `useShareReview(bookId)` mutation: `POST/PATCH /api/user/books/[id]/share`
    - `useDeleteShare(bookId)` mutation: `DELETE /api/user/books/[id]/share`
    - Place in appropriate `hooks/queries/` and `hooks/mutations/` directories
  - [x] 10.3 Build Settings screen (`app/(tabs)/settings.tsx`)
    - **Profile section**: Name text input, Username text input (with real-time availability check indicator), Bio text area (500 char limit with counter)
    - **Avatar section**: Display current avatar (from S3 or Google OAuth fallback), "Change Avatar" button triggering image picker and presigned URL upload flow (`GET /api/user/avatar/presigned-url` then PUT to S3 then `POST /api/user/avatar`)
    - **Reading goal**: Number input (1-500 range)
    - **Privacy toggles**: Profile Enabled, Show Currently Reading, Show TBR -- native Switch components
    - **Account section**: Email display (read-only), Sign Out button, Delete Account button
    - Save button persists all changes via `useUpdateSettings` mutation
    - Sign out triggers `signOut()` from auth context
  - [x] 10.4 Build Delete Account confirmation flow
    - Alert dialog with warning text matching web app's `DeleteAccountModal` behavior
    - Requires typing confirmation text (e.g., "DELETE")
    - Calls `DELETE /api/user` on confirmation
    - On success: clear auth state, navigate to sign-in screen
  - [x] 10.5 Build Profile tab screen (`app/(tabs)/profile.tsx`)
    - Display current user's public profile (same data as `/u/[username]`)
    - Fetches via `usePublicProfile(currentUser.username)`
    - Shows: avatar, name, username, bio, currently reading books (if enabled), shared reviews list, TBR section (if enabled)
    - Each shared review shows book cover, title, rating average
    - Tapping a book in "currently reading" or TBR navigates to Book Details
  - [x] 10.6 Build public profile view for other users
    - Accessible via navigation from shared reviews or direct username lookup
    - Uses same `usePublicProfile(username)` hook
    - Read-only view: avatar, name, username, bio, currently reading, shared reviews, TBR
    - No editing capabilities
  - [x] 10.7 Build Share Review modal (`app/(modals)/share-review.tsx`)
    - Accessible from Book Details on completed + rated books
    - Privacy toggles: Show Dates, Show Book Clubs, Show Readathons, Show Review Text -- native Switch components
    - "Create Share" / "Update Share" button calls `useShareReview` mutation
    - On success: generate share URL, open React Native `Share` API native share sheet with URL
    - "Delete Share" option calls `useDeleteShare` mutation with confirmation
  - [x] 10.8 Ensure settings, profile, and sharing tests pass
    - Run the 7 tests from 10.1

**Acceptance Criteria:**
- The 7 tests pass
- Settings screen loads, edits, and saves user preferences
- Username check shows availability status in real time
- Avatar upload works via presigned URL flow
- Sign-out clears all state and returns to sign-in
- Delete account works with confirmation
- Public profile displays correctly for current user and other users
- Share Review creates a shareable link and opens native share sheet

---

#### Task Group 11: Edit Book and Remaining Modals
**Dependencies:** Task Group 8 (Book Details provides navigation), Task Group 7 (form patterns from Add Book Wizard)

- [x] 11.0 Complete Edit Book and remaining modals
  - [x] 11.1 Write 4 focused tests for Edit Book
    - Test edit form pre-populates with current book data
    - Test status change updates dependent fields (e.g., changing to Completed shows finish date)
    - Test edit submission calls `PATCH /api/user/books/[id]` with changed fields
    - Test review text editing saves via the same PATCH endpoint
  - [x] 11.2 Create `useUpdateBook` mutation hook
    - `apps/mobile/src/hooks/mutations/useUpdateBook.ts`
    - `PATCH /api/user/books/[id]` with partial update payload
    - Optimistic cache update for book details and library list
    - Supports offline queueing
  - [x] 11.3 Build Edit Book modal (`app/(modals)/edit-book.tsx`)
    - Pre-populated form with current book data
    - Editable fields: Status, Format (multi-select), Start Date, Finish Date, Progress, Current Page
    - Tracking fields: Acquisition Method, Book Club, Readathon, Reread, DNF Reason (if DNF)
    - Diversity fields: LGBTQ Representation, Disability Representation, New Author, Author POC
    - Review text area
    - Save button submits changed fields only via `useUpdateBook`
    - On success: invalidate book detail and library caches, close modal
  - [x] 11.4 Ensure Edit Book tests pass
    - Run the 4 tests from 11.1

**Acceptance Criteria:**
- The 4 tests pass
- Edit form correctly pre-populates all fields
- Only changed fields are submitted in PATCH request
- Status changes update dependent fields dynamically
- Edit works offline (mutation queued)

---

### Phase 5: Polish and Integration

#### Task Group 12: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-11

- [x] 12.0 Review existing tests and fill critical gaps only
  - [x] 12.1 Review tests from all previous Task Groups
    - Review the 4 monorepo tests from Task Group 1 (1.1)
    - Review the 6 shared package tests from Task Group 2 (2.1)
    - Review the 5 mobile auth tests from Task Group 3 (3.1)
    - Review the 3 setup tests from Task Group 4 (4.1)
    - Review the 8 API/auth infrastructure tests from Task Group 5 (5.1)
    - Review the 5 library screen tests from Task Group 6 (6.1)
    - Review the 6 search/wizard tests from Task Group 7 (7.1)
    - Review the 5 book details tests from Task Group 8 (8.1)
    - Review the 6 rating/session tests from Task Group 9 (9.1)
    - Review the 7 settings/profile/sharing tests from Task Group 10 (10.1)
    - Review the 4 edit book tests from Task Group 11 (11.1)
    - Total existing tests: approximately 59 tests
  - [x] 12.2 Analyze test coverage gaps for this feature only
    - Identify critical end-to-end user workflows that lack coverage
    - Focus on integration points between mobile screens and API
    - Check offline queue reliability across app restart scenarios
    - Verify auth token refresh and expiry handling
    - Assess navigation flow correctness (tab switches, modal open/close, stack push/pop)
  - [x] 12.3 Write up to 10 additional strategic tests to fill critical gaps
    - Test end-to-end: search for book, add it, view in library, open details, rate it, share review
    - Test offline: go offline, add book, update progress, go online, verify queue processes
    - Test auth expiry: JWT expires mid-session, verify re-auth redirect
    - Test deep navigation: library -> book details -> rate -> summary -> submit -> back to details with updated rating
    - Test data consistency: add book optimistically, API fails, verify rollback removes book from cache
    - Additional tests as identified in gap analysis (up to 5 more)
  - [x] 12.4 Run all feature-specific tests
    - Run all tests from Task Groups 1-11 plus the new tests from 12.3
    - Expected total: approximately 59-69 tests
    - Verify all critical workflows pass
    - Do NOT run unrelated application tests outside this feature scope

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 59-69 tests total)
- Critical end-to-end user workflows are covered
- No more than 10 additional tests added
- Offline queue is verified to work reliably
- Auth flow handles edge cases (expiry, invalid token)
- All existing web app tests still pass (no regression from monorepo changes)

---

## Execution Order

Recommended implementation sequence with rationale:

```
Phase 1: Monorepo Foundation (must be first -- everything depends on new structure)
  1. Task Group 1: Monorepo Restructure
  2. Task Group 2: Shared TypeScript Package

Phase 2: Backend (single endpoint, minimal scope)
  3. Task Group 3: Mobile Authentication Endpoint

Phase 3: Mobile App Foundation (infrastructure before screens)
  4. Task Group 4: Expo Project Setup
  5. Task Group 5: API Client, Auth, and Offline Infrastructure

Phase 4: Core Mobile Screens (ordered by user flow dependency)
  6. Task Group 6: Library / Dashboard Screen
  7. Task Group 7: Book Search and Add Book Wizard
  8. Task Group 8: Book Details Screen
  9. Task Group 9: CAWPILE Rating and Reading Sessions
  10. Task Group 10: Settings, Profile, and Social Sharing
  11. Task Group 11: Edit Book and Remaining Modals

Phase 5: Polish and Integration
  12. Task Group 12: Test Review and Gap Analysis
```

**Parallelization opportunities:**
- Task Groups 6, 7, 10 can be worked on in parallel once Task Group 5 is complete (they share no direct dependencies on each other)
- Task Group 8 depends on Task Group 6 (navigation from library to details)
- Task Groups 9 and 11 depend on Task Group 8 (navigation from details to modals)
- Task Group 12 must be last

## Key Files Reference

| File / Directory | Purpose |
|---|---|
| `apps/web/src/types/book.ts` | Book, Edition, provider interfaces (source for shared extraction) |
| `apps/web/src/types/cawpile.ts` | CAWPILE facets, rating utilities (source for shared extraction) |
| `apps/web/src/types/dashboard.ts` | Dashboard book data types (source for shared extraction) |
| `apps/web/src/types/profile.ts` | Public profile data types (source for shared extraction) |
| `apps/web/src/lib/bookTypeDetection.ts` | Fiction/nonfiction detection (source for shared extraction) |
| `apps/web/src/components/modals/AddBookWizard.tsx` | Wizard step logic to replicate in mobile |
| `apps/web/src/hooks/useBookSearch.ts` | Search debounce pattern to replicate |
| `apps/web/src/lib/auth.ts` | NextAuth config -- reference for mobile JWT integration |
| `apps/web/src/lib/auth-helpers.ts` | `getCurrentUser()` -- must be updated to support Bearer tokens |
| `apps/web/src/lib/search/utils/signResult.ts` | HMAC signing -- mobile passes signed results through unchanged |
| `packages/shared/src/index.ts` | Shared package barrel exports (new) |
| `apps/mobile/src/lib/api.ts` | Centralized API client (new) |
| `apps/mobile/src/lib/auth.ts` | Mobile auth flow (new) |
| `apps/mobile/src/lib/offlineQueue.ts` | Offline action queue (new) |
| `apps/mobile/src/lib/queryClient.ts` | TanStack Query configuration (new) |
| `apps/mobile/src/lib/queryKeys.ts` | Query key factory (new) |
