# Todo List

## Phase 1: Database & Setup (Steps 1-2)
- [x] Add publisher, primaryGenre, audiobookDuration fields to schema
- [x] Run database migration "add_chart_fields"
- [x] Install Recharts charting library
- [x] Create chart color constants and configuration

## Phase 2: Dashboard Infrastructure (Steps 3-6)
- [x] Create tab navigation component for Books/Charts
- [x] Update dashboard page with tab navigation
- [x] Build ChartGrid responsive layout component
- [x] Create ChartCard wrapper component
- [x] Build YearSelector dropdown component
- [x] Create chart data caching context

## Phase 3: Chart Foundation (Steps 7-9)
- [ ] Create BarChartSkeleton loading component
- [ ] Create PieChartSkeleton loading component
- [ ] Build BaseBarChart reusable component
- [ ] Build BasePieChart reusable component
- [ ] Create ChartTooltip and ChartModal components
- [ ] Build data transformation utilities (processors, formatters)

## Phase 4: Monthly Bar Charts (Steps 10-17)
- [ ] Create books-per-month API endpoint
- [ ] Implement BooksPerMonthChart component
- [ ] Create pages-per-month API endpoint
- [ ] Implement PagesPerMonthChart component
- [ ] Create dnf-per-month API endpoint
- [ ] Implement DNFPerMonthChart component
- [ ] Create hours-listened API endpoint
- [ ] Implement HoursListenedChart component

## Phase 5: Pie Charts (Steps 18-27)
- [ ] Create dnf-reasons API endpoint
- [ ] Implement DNFReasonsChart component
- [ ] Create book-format API endpoint
- [ ] Implement BookFormatChart component
- [ ] Create reading-type API endpoint
- [ ] Implement ReadingTypeChart component
- [ ] Create book-clubs API endpoint
- [ ] Implement BookClubsChart component
- [ ] Create readathons API endpoint
- [ ] Implement ReadathonsChart component

## Phase 6: Genre & Data Updates (Steps 28-30)
- [ ] Update Google Books import for publisher/genre extraction
- [ ] Create genres API endpoint
- [ ] Implement MainGenresChart component

## Phase 7: Polish & Optimization (Steps 31-34)
- [ ] Create EmptyChartState component
- [ ] Add empty states to all charts
- [ ] Optimize for mobile devices
- [ ] Implement lazy loading with intersection observer
- [ ] Add React.memo for performance
- [ ] Test year selector with multiple years
- [ ] Test cache invalidation
- [ ] Test edge cases for all charts
- [ ] Final integration testing

## Completed Tasks
✅ Define chart requirements and types needed
✅ Create detailed implementation plan
✅ Break down into incremental steps
✅ Generate implementation prompts

## Notes
- Each phase builds on the previous one
- Test each component after implementation
- Ensure TypeScript types are maintained
- Follow existing Cawpile patterns and styles