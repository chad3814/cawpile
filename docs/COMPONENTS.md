# Component Catalog

React component documentation for Cawpile.

## Component Architecture

Cawpile uses Next.js 15 App Router with React 19:

- **Server Components** (default): Pages, layouts, data-fetching wrappers
- **Client Components** (`"use client"`): Interactive features, forms, modals

---

## Dashboard Components

### DashboardClient

Main dashboard container with tab navigation.

```tsx
// src/components/dashboard/DashboardClient.tsx
<DashboardClient
  initialBooks={UserBook[]}
  initialLayout="GRID" | "TABLE"
/>
```

**Features:**
- Tab navigation (Books, Charts, Stats)
- Layout persistence
- Book filtering and sorting

### BookGrid / BookTable

Book display views with different layouts.

```tsx
<BookGrid
  books={UserBook[]}
  onBookClick={(book) => void}
  onAddBook={() => void}
/>

<BookTable
  books={UserBook[]}
  sortBy="END_DATE"
  sortOrder="DESC"
  onSort={(field) => void}
/>
```

### BookCard

Individual book display card.

```tsx
<BookCard
  book={UserBook}
  onClick={() => void}
  showRating={boolean}
  showProgress={boolean}
/>
```

**Displays:**
- Cover image
- Title and author
- Reading status badge
- Progress bar (if reading)
- CAWPILE rating (if rated)

### ViewSwitcher

Toggle between grid and table views.

```tsx
<ViewSwitcher
  view="grid" | "table"
  onChange={(view) => void}
/>
```

### LayoutToggle

Persistent layout preference toggle.

```tsx
<LayoutToggle
  layout="GRID" | "TABLE"
  onToggle={() => void}
/>
```

**Behavior:**
- Optimistic UI update
- Persists to database via `/api/user/preferences`

### SortDropdown

Book sorting options.

```tsx
<SortDropdown
  sortBy="END_DATE" | "START_DATE" | "TITLE" | "DATE_ADDED"
  sortOrder="ASC" | "DESC"
  onChange={(sortBy, sortOrder) => void}
/>
```

### TabNavigation

Dashboard section tabs.

```tsx
<TabNavigation
  activeTab="books" | "charts" | "stats"
  onTabChange={(tab) => void}
  bookCount={number}
/>
```

---

## Modal Components

### BookSearchModal

Search and select books to add.

```tsx
<BookSearchModal
  isOpen={boolean}
  onClose={() => void}
  onBookSelect={(result: SearchResult) => void}
/>
```

**Features:**
- Debounced search (300ms)
- Multi-provider results
- Loading states
- Result ranking display

### AddBookWizard

Multi-step book addition flow.

```tsx
<AddBookWizard
  isOpen={boolean}
  onClose={() => void}
  searchResult={SearchResult}
  onComplete={(userBook) => void}
/>
```

**Steps:**
1. Status selection (Want to Read, Reading, Completed, DNF)
2. Format selection (Physical, Ebook, Audiobook)
3. Tracking details (acquisition, book club, readathon)
4. Dates (start date, finish date based on status)

### BookDetailsModal

View and manage book details.

```tsx
<BookDetailsModal
  isOpen={boolean}
  onClose={() => void}
  book={UserBook}
  onUpdate={() => void}
/>
```

**Actions:**
- Update progress
- Change status
- Edit details
- Rate book
- Write review
- Share review
- Remove from library

### CawpileRatingModal

7-facet rating entry.

```tsx
<CawpileRatingModal
  isOpen={boolean}
  onClose={() => void}
  book={UserBook}
  existingRating={CawpileRating | null}
  onSave={(rating) => void}
/>
```

**Features:**
- Facet sliders (1-10)
- Dynamic facet labels (Fiction vs Non-Fiction)
- Live average calculation
- Star rating preview
- Grade preview

### ReviewModal

Write or edit book review.

```tsx
<ReviewModal
  isOpen={boolean}
  onClose={() => void}
  book={UserBook}
  onSave={(review: string) => void}
/>
```

### ShareReviewModal

Configure and share review.

```tsx
<ShareReviewModal
  isOpen={boolean}
  onClose={() => void}
  book={UserBook}
  existingShare={SharedReview | null}
/>
```

**Privacy Options:**
- Show/hide dates
- Show/hide book club
- Show/hide readathon
- Show/hide review text

### UpdateProgressModal

Update reading progress.

```tsx
<UpdateProgressModal
  isOpen={boolean}
  onClose={() => void}
  book={UserBook}
  onSave={(progress: number, currentPage: number) => void}
/>
```

### MarkCompleteModal

Mark book as completed.

```tsx
<MarkCompleteModal
  isOpen={boolean}
  onClose={() => void}
  book={UserBook}
  onComplete={(finishDate: Date) => void}
/>
```

### MarkDNFModal

Mark book as did-not-finish.

```tsx
<MarkDNFModal
  isOpen={boolean}
  onClose={() => void}
  book={UserBook}
  onDNF={(reason: string) => void}
/>
```

---

## Chart Components

### ChartCard

Wrapper for individual charts.

```tsx
<ChartCard
  title="Books Per Month"
  loading={boolean}
  error={string | null}
  onRefresh={() => void}
>
  <BooksPerMonthChart data={data} />
</ChartCard>
```

### ChartGrid

Grid layout for multiple charts.

```tsx
<ChartGrid>
  <ChartCard>...</ChartCard>
  <ChartCard>...</ChartCard>
</ChartGrid>
```

### YearSelector

Year selection for chart filtering.

```tsx
<YearSelector
  selectedYear={number}
  availableYears={number[]}
  onChange={(year) => void}
/>
```

### Chart Types

All charts use Recharts v3.2 with consistent styling.

```tsx
// Monthly stacked bar chart
<BooksPerMonthChart
  data={[{ month: "Jan", completed: 5, dnf: 1 }]}
/>

// Pages per month bar chart
<PagesPerMonthChart
  data={[{ month: "Jan", pages: 1500 }]}
/>

// Pie chart variants
<BookFormatChart data={[{ name: "Ebook", value: 25 }]} />
<MainGenresChart data={...} />
<AcquisitionMethodChart data={...} />

// Representation pie charts
<LgbtqRepresentationChart data={...} />
<DisabilityRepresentationChart data={...} />
<PocAuthorsChart data={...} />
<NewAuthorsChart data={...} />
```

---

## Form Components

Reusable form fields for modals.

### AcquisitionMethodField

```tsx
<AcquisitionMethodField
  value={AcquisitionMethod | null}
  onChange={(value) => void}
/>
```

**Options:** Purchased, Library, Gifted, Borrowed, Free, Subscription, Other

### BookClubField

```tsx
<BookClubField
  value={string}
  onChange={(value) => void}
/>
```

**Features:**
- Autocomplete from user's previous book clubs
- Free text input
- Usage count sorting

### ReadathonField

```tsx
<ReadathonField
  value={string}
  onChange={(value) => void}
/>
```

### FormatMultiSelect

```tsx
<FormatMultiSelect
  value={BookFormat[]}
  onChange={(formats) => void}
/>
```

**Options:** Hardcover, Paperback, Ebook, Audiobook

### RepresentationField

```tsx
<RepresentationField
  type="lgbtq" | "disability" | "authorPoc"
  value={RepresentationValue | null}
  details={string}
  onChange={(value, details) => void}
/>
```

**Options:** Yes, No, Unknown (with optional details)

### RereadField

```tsx
<RereadField
  value={boolean}
  onChange={(value) => void}
/>
```

### NewAuthorField

```tsx
<NewAuthorField
  value={boolean | null}
  onChange={(value) => void}
/>
```

### ReviewTextareaField

```tsx
<ReviewTextareaField
  value={string}
  onChange={(value) => void}
  placeholder="Write your review..."
  maxLength={5000}
/>
```

---

## Rating Components

### CawpileFacetDisplay

Single facet display with score.

```tsx
<CawpileFacetDisplay
  label="Characters"
  score={8}
  maxScore={10}
/>
```

### StarRating

Interactive or display star rating.

```tsx
<StarRating
  value={4}
  onChange={(value) => void}  // If interactive
  readonly={boolean}
  size="sm" | "md" | "lg"
/>
```

### RatingCard

Full CAWPILE rating display.

```tsx
<RatingCard
  rating={CawpileRating}
  bookType="FICTION" | "NONFICTION"
/>
```

### RatingSummaryCard

Compact rating summary.

```tsx
<RatingSummaryCard
  average={8.0}
  stars={4}
  grade="B+"
/>
```

---

## Profile Components

### ProfilePageClient

Public profile page container.

```tsx
<ProfilePageClient
  user={PublicUser}
  stats={ProfileStats}
  currentlyReading={UserBook[]}
  recentBooks={UserBook[]}
  sharedReviews={SharedReview[]}
/>
```

### ProfileHeader

User profile header with avatar and bio.

```tsx
<ProfileHeader
  user={PublicUser}
  stats={ProfileStats}
/>
```

### ProfileBookGrid / ProfileBookTable

Public profile book displays.

```tsx
<ProfileBookGrid books={UserBook[]} />
<ProfileBookTable books={UserBook[]} />
```

### SharedReviewsSection

Section displaying user's shared reviews.

```tsx
<SharedReviewsSection
  reviews={SharedReview[]}
  username={string}
/>
```

---

## Share Components

### PublicReviewDisplay

Public-facing review display.

```tsx
<PublicReviewDisplay
  review={SharedReview}
  book={UserBook}
  user={PublicUser}
/>
```

### ReviewImageTemplate

Shareable image generation template.

```tsx
<ReviewImageTemplate
  book={UserBook}
  rating={CawpileRating}
  review={string}
  username={string}
/>
```

---

## Admin Components

### BookTable (Admin)

Admin book management table.

```tsx
<BookTable
  books={AdminBook[]}
  selectedIds={Set<string>}
  onSelect={(id) => void}
  onEdit={(book) => void}
  onDelete={(book) => void}
  onResync={(book) => void}
/>
```

### BookFilters

Admin book filtering controls.

```tsx
<BookFilters
  search={string}
  onSearchChange={(value) => void}
  hasIssues={boolean}
  onHasIssuesChange={(value) => void}
/>
```

### BulkActionBar

Bulk operations toolbar.

```tsx
<BulkActionBar
  selectedCount={number}
  onDelete={() => void}
  onMerge={() => void}
  onUpdateType={() => void}
/>
```

### DataQualityWidget

Data quality metrics display.

```tsx
<DataQualityWidget
  issues={DataQualityIssue[]}
  onFixIssue={(issue) => void}
/>
```

### AdminNav

Admin navigation sidebar.

```tsx
<AdminNav
  currentPath={string}
/>
```

---

## Layout Components

### Header

Global navigation header.

```tsx
<Header />
```

**Features:**
- Logo/home link
- Navigation links
- User menu (authenticated)
- Sign in button (unauthenticated)

### Footer

Global footer.

```tsx
<Footer />
```

### UserMenu

User dropdown menu.

```tsx
<UserMenu
  user={User}
/>
```

**Menu Items:**
- Dashboard
- Settings
- Admin (if admin)
- Sign out

---

## Utility Components

### ErrorBoundary

Error handling wrapper.

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <ComponentThatMightError />
</ErrorBoundary>
```

### TrackingBadges

Reading status and format badges.

```tsx
<TrackingBadges
  status="READING"
  formats={["EBOOK"]}
  progress={45}
/>
```

### EmptyLibrary

Empty state for library.

```tsx
<EmptyLibrary
  onAddBook={() => void}
/>
```

---

## Hooks

### useBookSearch

Book search with debouncing.

```tsx
const { results, loading, error, search } = useBookSearch();

// Usage
search("The Great Gatsby");
```

### useBookClubs

Fetch user's book clubs for autocomplete.

```tsx
const { bookClubs, loading } = useBookClubs();
```

### useReadathons

Fetch user's readathons for autocomplete.

```tsx
const { readathons, loading } = useReadathons();
```

### useUsernameCheck

Check username availability.

```tsx
const { available, checking, check } = useUsernameCheck();

// Usage
check("johndoe");
```

### useDebounce

Generic debounce utility.

```tsx
const debouncedValue = useDebounce(value, 300);
```

---

## Context

### ChartDataContext

Chart data caching with 30-minute TTL.

```tsx
// Provider (in layout)
<ChartDataProvider>
  <App />
</ChartDataProvider>

// Consumer hook
const {
  data,
  loading,
  error,
  fetchChartData,
  clearCache
} = useChartData();

// Fetch specific chart
await fetchChartData('books-per-month', 2024);
await fetchChartData('books-per-month', 2024, true); // Force refresh
```

**Cache Behavior:**
- Memory storage during session
- sessionStorage persistence
- 30-minute TTL per chart/year combination
- Per-chart loading and error states
