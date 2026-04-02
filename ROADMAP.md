# Cawpile Roadmap

## v1.1 — UI & Dashboard Improvements

### Minor Changes

- [X] **Remove dashboard header page** — eliminate the landing/header page shown on first dashboard load
- [X] **Redesign book cards in Your Library**
  - Retain cover image and kebab menu
  - Collapse the info section below the cover by default, showing only the title
  - When collapsed and the book is in progress, render the progress bar overlaid on the cover image
  - When expanded, render the progress bar in the info section as currently
- [X] **Split Library into TBR and Completed** — break the single library section into distinct TBR and Completed subsections
- [X] **Hero-scroll library sections** — each Your Library subsection (Currently Reading, TBR, Completed) shows a few items and scrolls horizontally like a hero carousel
- [X] **Profile page hero sections** — remove the icon/table toggle; each profile section scrolls like a hero carousel matching the library sections
- [ ] **Dashboard tab layout** — replace horizontal tabs with a vertical sidebar, with sub-items for in-page anchors:
  - **Books** — site-wide book info
  - **Authors** — site-wide author info
  - **Your Library**
    - Currently Reading
    - TBR
    - Completed
  - **Recaps**
  - **Charts**
- [X] **Monthly recap defaults to previous month** — if the current day of the month is ≤ 10, default the monthly recap view to the previous month

---

## v1.2 — Discovery & Personalization

### New Features

- [ ] **Individual book pages**
  - Public reviews table with overall review means
- [ ] **Individual author pages**
  - Table of books, with tracked books surfaced at the top
- [ ] **Individual library section pages** — clicking a section header (Currently Reading, TBR, Completed) opens a full page showing all books in that category
  - Users can re-order books and pin them
  - Pinned/ordered books appear in this order on the dashboard and profile pages
- [ ] **Genre chart and tracking**
- [ ] **Smart defaults for diversity fields** — pre-fill LGBTQ+, Disability, and Author POC fields based on the user's previous reviews of the same book/author
- [ ] **Second recap template** — supports up to 9 books displayed simultaneously
- [ ] **Recap background customization** — choose a solid color, gradient, or looping video background for recap exports
- [ ] **Extended recap periods** — quarterly, half-year, and full-year recaps
  - These recaps showcase charts and goal progress in addition to books

---

## v2.0 — Social & Mobile

### Major Changes

- [ ] **Mobile-first responsive design** — the mobile website must be fully usable, including viewing review images and watching recap videos
- [ ] **Social interactions** — shift from pure tracking tool to a platform that supports community engagement
- [ ] **Anonymized stats and review rollups** — aggregate and surface community-wide reading data and trends
- [ ] **Individual book pages** *(expanded from v1.2)*
  - Public reviews table with overall review means
- [ ] **Individual author pages** *(expanded from v1.2)*
  - Table of books, tracked books at the top

### New Features

- [ ] **Following system** — unidirectional follows for both users and authors
  - [ ] **Notifications column** (right sidebar) with items for:
    - New books from followed authors *(future feature)*
    - New completed books from followed users
    - New TBR additions from followed users
    - Reading progress updates from followed users
    - New followers
  - [ ] **Sharing settings** — per-user toggles to enable/disable broadcasting each activity type to followers
