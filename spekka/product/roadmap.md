# Product Roadmap

## Current State (Phase 1 Complete)

The following features are fully implemented and operational:

- [x] User authentication with Google OAuth via NextAuth v5
- [x] Multi-provider book search (LocalDB, Hardcover, Google Books, IBDB)
- [x] Book and Edition dual-level storage with deduplication
- [x] CAWPILE 7-facet rating system (fiction and non-fiction variants)
- [x] Reading status tracking (Want to Read, Reading, Completed, DNF)
- [x] Format tracking (Physical, Ebook, Audiobook, Graphic Novel)
- [x] Reading session logging (page-by-page progress)
- [x] Book club and readathon tracking with autocomplete
- [x] Acquisition method tracking
- [x] Dashboard with Grid and Table layout options
- [x] Analytics charts (books/pages per month, format distribution, genres)
- [x] Representation statistics (LGBTQ+, disability, POC authors, new authors)
- [x] Year filtering for all analytics
- [x] Social sharing with privacy controls
- [x] Shareable review image generation
- [x] Public profile pages
- [x] Admin panel with user management
- [x] Admin audit logging
- [x] Book type auto-detection from Google Books categories

---

## Phase 2: Enhancements

1. [ ] **Reading Goals and Challenges** — Create system for users to set annual reading goals (book count, page count, genre diversity) with progress tracking dashboard and milestone notifications. Include preset challenge templates (52 books/year, read-a-thon goals, genre challenges). `L`

2. [ ] **Series and Collection Management** — Implement series tracking with automatic book ordering, completion progress bars, and next-in-series recommendations. Support custom collections (owned vs wishlist, signed copies, first editions) with bulk tagging. `M`

3. [ ] **Reading Statistics Dashboard** — Expand analytics with average rating trends, reading pace analysis (pages/day), genre distribution pie charts, author frequency tracking, and busiest reading months heatmaps. `M`

4. [ ] **Book Notes and Annotations** — Add rich text note-taking per book with chapter/page references, favorite quotes capture, and tag-based note organization. Support exporting notes to markdown for external use. `L`

5. [ ] **Advanced Search and Filtering** — Build comprehensive library search with multi-criteria filtering (rating ranges, date ranges, formats, clubs, tags), saved filter presets, and sort options (by rating facets, completion date, title, author). `M`

6. [ ] **Import from Other Platforms** — Create importers for Goodreads CSV exports, StoryGraph data, and generic CSV formats with field mapping interface. Preserve ratings, dates, and shelves during migration. `L`

7. [ ] **Custom Rating Facets** — Allow users to customize CAWPILE facet names and weights based on personal priorities (e.g., rename "Intrigue" to "Suspense", weight Writing higher than Plot), with preset templates for different reader types. `M`

8. [ ] **Export and Backup Tools** — Implement full data export to JSON/CSV formats, automatic backup scheduling, and one-click account data download for portability and GDPR compliance. `S`

> Notes
> - Phase 2 focuses on depth and personalization for existing users
> - Import/Export is critical for user acquisition from competing platforms
> - Custom rating facets extend the core differentiator

---

## Phase 3: Growth and Community

1. [ ] **Mobile Progressive Web App** — Optimize responsive design for mobile with offline-first architecture, quick book logging shortcuts, barcode ISBN scanner using device camera, and home screen installation support. `XL`

2. [ ] **Social Book Clubs Feature** — Extend book club tracking to full-featured clubs with member management, discussion threads per book, voting on next selections, and reading schedule coordination. `XL`

3. [ ] **Book Recommendations Engine** — Develop recommendation algorithm based on CAWPILE facet preferences (e.g., prioritize high character ratings), reading history patterns, and genre preferences with explanation of why books are recommended. `XL`

4. [ ] **Reading Streaks and Achievements** — Gamify reading with streak tracking (consecutive days/months reading), achievement badges (milestones, genre diversity, speed reading), and yearly reading wrapped summaries. `M`

5. [ ] **Author and Publisher Pages** — Create dedicated pages aggregating all books by author/publisher with biographical info from external APIs, reading statistics per author, and follow/notification features for new releases. `L`

6. [ ] **Reading Journal Integration** — Build calendar view showing reading sessions and books completed per day, with diary-style daily reading reflections and mood tracking alongside reading activity. `M`

7. [ ] **Friend System** — Follow other users, see friend activity feed, and compare reading statistics. `L`

8. [ ] **Review Comments** — Allow comments on public reviews to foster discussion and community engagement. `M`

> Notes
> - Phase 3 focuses on community building and platform expansion
> - Mobile PWA is high effort but critical for reading session logging convenience
> - Social features drive viral growth and retention

---

## Effort Scale

| Code | Duration | Description |
|------|----------|-------------|
| `XS` | 1 day | Simple feature, minimal backend changes |
| `S` | 2-3 days | Small feature, single component or endpoint |
| `M` | 1 week | Medium feature, multiple components and API changes |
| `L` | 2 weeks | Large feature, significant architecture or new systems |
| `XL` | 3+ weeks | Extra large, major platform addition or external integration |
