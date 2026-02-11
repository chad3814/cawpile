# Product Roadmap

## Current State

The following features are fully implemented and operational:

- [x] User authentication with Google OAuth via NextAuth v5
- [x] Multi-provider book search (LocalDB, Hardcover, Google Books, IBDB)
- [x] Book and Edition dual-level storage with deduplication
- [x] CAWPILE 7-facet rating system (fiction and non-fiction variants)
- [x] Reading status tracking (Want to Read, Reading, Completed, DNF)
- [x] Format tracking (Hardcover, Paperback, Ebook, Audiobook)
- [x] Reading session logging (page-by-page progress)
- [x] Book club and readathon tracking with autocomplete
- [x] Dashboard with grid and table layout options
- [x] Analytics charts (books/pages per month, format distribution, genres)
- [x] Representation statistics (LGBTQ+, disability, POC authors, new authors)
- [x] Social sharing with privacy controls
- [x] Shareable review image generation
- [x] Public profile pages
- [x] Admin panel with user management and audit logging
- [x] Book type auto-detection (fiction/non-fiction)
- [x] Monthly recap (basic, available to all users)
- [x] Video template CRUD API with admin auth

---

## Up Next

1. [ ] **Recap Template System** — Build an admin-facing template builder that defines the structure, layout, and style of monthly recap videos. Templates should be composable from reusable sections (intro, book list, ratings summary, stats highlights, outro) with configurable visual properties per section. `L`

2. [ ] **Recap Template Rendering** — Implement the video rendering pipeline that takes a selected template and a user's monthly reading data and produces a downloadable video file. Users should be able to preview the recap before rendering and choose which template to use. `XL`

3. [ ] **Recap Content Customization** — Allow users to customize which books, stats, and data points appear in their monthly recap before rendering. Support toggling individual books on/off, choosing highlight stats, and adding optional personal commentary text overlays. `M`

4. [ ] **Recap Sharing and Export** — Enable direct sharing of rendered recap videos to social platforms. Support downloading in formats optimized for TikTok, Instagram Stories/Reels, and standard landscape video. Include watermark/branding options. `M`

5. [ ] **Import from Other Platforms** — Create importers for Goodreads CSV exports and StoryGraph data with a field mapping interface. Preserve ratings, dates, shelves, and reading history during migration to reduce friction for new users switching platforms. `L`

6. [ ] **Advanced Library Search and Filtering** — Build comprehensive library filtering with multi-criteria support (rating ranges, date ranges, formats, book clubs, readathons, tags) and saved filter presets. Enable sorting by individual CAWPILE facets. `M`

7. [ ] **Reading Goals** — Create a system for users to set annual reading goals (book count, page count) with a progress tracking widget on the dashboard and milestone markers throughout the year. `M`

8. [ ] **Series Tracking** — Implement series detection and tracking with automatic book ordering, completion progress indicators, and a view that shows which books in a series the user has read versus not yet read. `M`

9. [ ] **Export and Backup** — Implement full data export to JSON and CSV formats with one-click account data download for portability and data ownership. `S`

10. [ ] **Book Notes and Quotes** — Add per-book note-taking with page/chapter references and favorite quote capture. Support tagging and searching across all notes. `M`

> Notes
> - Items 1-4 are the monthly recap templating feature, the current top priority
> - Order reflects technical dependencies (template system must exist before rendering, rendering before sharing)
> - Import (item 5) is critical for user acquisition from competing platforms
> - Each item represents an end-to-end functional and testable feature
