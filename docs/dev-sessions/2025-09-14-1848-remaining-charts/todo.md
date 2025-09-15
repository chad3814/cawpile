# Todo List

## Phase 1: Monthly Bar Charts
- [ ] Create pages-per-month API endpoint
- [ ] Implement PagesPerMonthChart component
- [ ] Create dnf-per-month API endpoint
- [ ] Implement DNFPerMonthChart component
- [ ] Create hours-listened API endpoint
- [ ] Implement HoursListenedChart component

## Phase 2: Simple Pie Charts
- [ ] Create reading-type API endpoint
- [ ] Implement ReadingTypeChart component
- [ ] Create dnf-reasons API endpoint
- [ ] Implement DNFReasonsChart component

## Phase 3: Complex Pie Charts
- [ ] Create book-clubs API endpoint
- [ ] Implement BookClubsChart component
- [ ] Create readathons API endpoint
- [ ] Implement ReadathonsChart component
- [ ] Create genres API endpoint
- [ ] Implement MainGenresChart component

## Integration & Testing
- [ ] Update ChartsTab to include all 8 new charts
- [ ] Test all charts with real data
- [ ] Verify year selector updates all charts
- [ ] Check empty states for all charts
- [ ] Test error handling
- [ ] Verify loading states
- [ ] Check tooltips and formatting
- [ ] Test on mobile viewport
- [ ] Final review and cleanup

## Completed Tasks
✅ Infrastructure already built (previous session)
✅ Base chart components available
✅ Data processors and formatters ready
✅ Two example charts working (Books per Month, Book Format)

## Notes
- Follow patterns from BooksPerMonthChart for bar charts
- Follow patterns from BookFormatChart for pie charts
- Use existing color constants from CHART_COLORS
- Apply processMonthlyData() for bar charts
- Apply aggregatePieData() for pie charts with >7 segments
- All charts must filter by selected year
- Maintain consistent empty state messages