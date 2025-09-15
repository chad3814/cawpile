# Development Plan: Remaining Charts Implementation

## Overview
This plan focuses on implementing the remaining 8 charts using the existing infrastructure built in the previous session.

## Implementation Order

### Phase 1: Monthly Bar Charts (3 charts)
1. Pages per Month
2. DNF per Month
3. Hours Listened per Month

### Phase 2: Simple Pie Charts (2 charts)
4. Reading Type (2 segments only)
5. DNF Reasons

### Phase 3: Complex Pie Charts (3 charts)
6. Book Clubs
7. Readathons
8. Main Genres

---

## Detailed Implementation Steps

### Chart 1: Pages per Month

**API Endpoint** (`/api/charts/pages-per-month/route.ts`):
```typescript
- Query UserBook with GoogleBook relation for pageCount
- For missing pageCounts, look up from other editions (prefer same format)
- Sum total pages per month
- Apply processMonthlyData() for trimming
- Return formatted data
```

**Component** (`PagesPerMonthChart.tsx`):
```typescript
- Copy structure from BooksPerMonthChart
- Use CHART_COLORS.pages for color
- Format large numbers with formatPageCount()
- Empty state: "No pages tracked this year"
```

---

### Chart 2: DNF per Month

**API Endpoint** (`/api/charts/dnf-per-month/route.ts`):
```typescript
- Query UserBook where status = 'DNF'
- Group by month using finishDate
- Apply processMonthlyData() for trimming
- Return monthly counts
```

**Component** (`DNFPerMonthChart.tsx`):
```typescript
- Copy structure from BooksPerMonthChart
- Use CHART_COLORS.dnf (red) for color
- Format with formatBookCount()
- Empty state: "No DNF books this year - great job!"
```

---

### Chart 3: Hours Listened per Month

**API Endpoint** (`/api/charts/hours-listened/route.ts`):
```typescript
- Query UserBook where format = 'AUDIOBOOK'
- Join with GoogleBook for audiobookDuration
- Calculate: (progress / 100) * (duration || 600) / 60
- Add isEstimate flag when using default
- Group by month and sum hours
- Apply processMonthlyData()
```

**Component** (`HoursListenedChart.tsx`):
```typescript
- Copy structure from BooksPerMonthChart
- Use CHART_COLORS.audiobook for color
- Format with formatHours()
- Show asterisk (*) for months with estimates
- Add note at bottom if any estimates exist
- Empty state: "No audiobooks this year"
```

---

### Chart 4: Reading Type

**API Endpoint** (`/api/charts/reading-type/route.ts`):
```typescript
- Query UserBook for year
- Count isReread = true vs false/null
- Return as [{name: "Reread", value: X}, {name: "First Time", value: Y}]
- Calculate percentages
```

**Component** (`ReadingTypeChart.tsx`):
```typescript
- Copy structure from BookFormatChart
- Use [CHART_COLORS.reread, CHART_COLORS.firstTime]
- Format with formatBookCount()
- Handle 100% first-time case
- Empty state: "No books completed this year"
```

---

### Chart 5: DNF Reasons

**API Endpoint** (`/api/charts/dnf-reasons/route.ts`):
```typescript
- Query UserBook where status = 'DNF' AND dnfReason NOT NULL
- Group by dnfReason and count
- Apply aggregatePieData() for top 7 + other
- Return with percentages
```

**Component** (`DNFReasonsChart.tsx`):
```typescript
- Copy structure from BookFormatChart
- Use CHART_COLORS.categorical
- Show reason and count in tooltip
- Empty state: "No DNF reasons recorded"
```

---

### Chart 6: Book Clubs

**API Endpoint** (`/api/charts/book-clubs/route.ts`):
```typescript
- Query UserBook for year
- Group by bookClubName
- Separate null values as "No Club"
- Apply aggregatePieData() for top 7 + other
- Return with counts
```

**Component** (`BookClubsChart.tsx`):
```typescript
- Copy structure from BookFormatChart
- Use CHART_COLORS.categorical
- Truncate long club names in legend
- Show full name in tooltip
- Empty state: "No book club reads this year"
```

---

### Chart 7: Readathons

**API Endpoint** (`/api/charts/readathons/route.ts`):
```typescript
- Query UserBook for year
- Group by readathonName
- Separate null values as "No Readathon"
- Apply aggregatePieData() for top 7 + other
- Return with counts
```

**Component** (`ReadathonsChart.tsx`):
```typescript
- Copy structure from BookFormatChart
- Use CHART_COLORS.categorical
- Handle long readathon names
- Empty state: "No readathon participation this year"
```

---

### Chart 8: Main Genres

**API Endpoint** (`/api/charts/genres/route.ts`):
```typescript
- Query UserBook with Book relation for primaryGenre
- Group by primaryGenre
- Handle null as "Unknown"
- Apply aggregatePieData() for top 7 + other
- Return with counts
```

**Component** (`MainGenresChart.tsx`):
```typescript
- Copy structure from BookFormatChart
- Use CHART_COLORS.categorical
- Consider genre-specific colors later
- Empty state: "No genre data available"
```

---

## Integration Steps

### Update ChartsTab.tsx:
Replace placeholders with actual components in this order:
1. Pages per Month (placeholder-2)
2. DNF per Month (placeholder-3)
3. Hours Listened (new card)
4. DNF Reasons (new card)
5. Reading Type (placeholder-4)
6. Book Clubs (new card)
7. Readathons (new card)
8. Main Genres (placeholder-5)

### Testing Checklist for Each Chart:
- [ ] API returns correct data
- [ ] Chart displays with real data
- [ ] Year selector changes data
- [ ] Empty state shows correctly
- [ ] Loading state works
- [ ] Error handling works
- [ ] Tooltips show correct info
- [ ] Colors are appropriate

## Time Estimates
- Each bar chart: ~15 minutes
- Each simple pie chart: ~15 minutes
- Each complex pie chart: ~20 minutes
- Testing and integration: ~20 minutes
- **Total estimate**: ~2.5 hours