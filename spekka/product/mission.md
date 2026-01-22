# Product Mission

## Pitch

Cawpile is a **book reading tracker** that helps **avid readers and book enthusiasts** track their reading journey with meaningful depth by providing a **unique 7-facet rating system, multi-source book discovery, detailed reading analytics, and social sharing capabilities**.

## Users

### Primary Customers

- **Avid Readers**: People who read 10+ books per year and want to track their reading habits systematically
- **Book Club Members**: Readers participating in book clubs who need organized tracking of group reads
- **Reading Challenge Participants**: Users participating in readathons or annual reading challenges (Goodreads, StoryGraph alternatives)
- **Data-Driven Readers**: People who enjoy analyzing their reading patterns, genres, and progress over time

### User Personas

**Sarah, The Analytical Reader** (28-45)
- **Role:** Software engineer who reads 50+ books annually
- **Context:** Wants data-driven insights into reading habits and detailed book analysis
- **Pain Points:** Goodreads ratings feel shallow; no way to track nuanced opinions like pacing vs character development separately
- **Goals:** Understand reading patterns, remember why she rated books certain ways, make informed reading choices

**Marcus, The Book Club Leader** (35-60)
- **Role:** Runs monthly neighborhood book club with 12 active members
- **Context:** Needs to organize reading schedules and track club selections
- **Pain Points:** Hard to remember which books were club selections; no central tracking for group reads
- **Goals:** Keep club reading history organized, avoid re-selecting books, share reading lists with members

**Emily, The Readathon Enthusiast** (22-35)
- **Role:** Participates in 4-6 readathons yearly (Bout of Books, Dewey's 24-Hour, etc.)
- **Context:** Tracks multiple concurrent reading challenges with specific goals
- **Pain Points:** Cannot easily filter books by readathon or track progress toward challenge goals
- **Goals:** Monitor readathon progress, celebrate achievements, plan future challenge strategies

## The Problem

### Generic Ratings Do Not Capture Reading Complexity

Traditional 1-5 star ratings force readers to compress multi-dimensional reading experiences into a single number. A book might have excellent characters but poor pacing, or brilliant writing but a frustrating plot. Readers lose this nuance when forced to average everything into one rating, making it hard to remember why they rated a book 3 vs 4 stars months later.

**Our Solution:** The CAWPILE system breaks ratings into 7 customizable facets (Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment), allowing readers to capture exactly what worked and what did not. Different facets adapt for fiction vs non-fiction, ensuring relevance across genres.

### Reading Progress Tracking Lacks Granularity

Most platforms only track "started" and "finished" dates, missing the rich story of how a book was actually read. Readers have no way to see reading velocity, breaks taken, or pace changes throughout a book.

**Our Solution:** Page-by-page session tracking captures when and how fast books are read, enabling analytics like "books per month" and "reading pace" charts while preserving the complete reading journey.

### No Organized Memory for Social Reading Context

Readers participate in book clubs, readathons, and reading challenges but have no central place to track which books were read in which context. This makes it impossible to answer questions like "What did we read in book club last spring?" or "How many readathon books did I complete this year?"

**Our Solution:** Built-in book club and readathon tracking with autocomplete memory stores social reading context alongside every book, making it easy to filter and analyze reading by community participation.

### Fragmented Book Data

Searching for books requires checking multiple sources. Local libraries, Google Books, Hardcover, and specialty databases all have different coverage and metadata quality.

**Our Solution:** Multi-provider search orchestration queries all sources simultaneously, deduplicates results, and presents the best available metadata.

## Differentiators

### CAWPILE Rating System

Unlike Goodreads or StoryGraph which use simple star ratings or preset categories, we provide a structured 7-facet rating framework that adapts to book type. This results in more meaningful ratings that preserve the complexity of reading opinions while remaining actionable for future book selection.

### Multi-Provider Search Orchestration

Unlike single-source book databases, we aggregate results from Google Books, Hardcover, IBDB, and local database simultaneously with intelligent result merging. This results in higher-quality metadata, better ISBN coverage, and fewer "book not found" scenarios.

### Dual-Level Book Storage Architecture

Unlike platforms that duplicate entire book records for different editions, we separate Book (title + authors) from Edition (ISBN-specific metadata). This results in cleaner data management, better deduplication, and the ability to track multiple editions of the same book without confusion.

### Representation Analytics

Unlike generic stats, we track and visualize diversity metrics including LGBTQ+ representation, disability representation, POC authors, and new-to-user authors.

### Social Sharing with Privacy Controls

Unlike all-or-nothing sharing, users control exactly what appears in public reviews: dates, book clubs, readathons, and review text can be individually toggled.

## Key Features

### Core Features

- **CAWPILE Rating System:** Rate books across 7 customizable facets with auto-computed averages, star ratings, and letter grades for nuanced opinion tracking
- **Multi-Provider Book Search:** Find books instantly across Google Books, Hardcover, IBDB, and local database with deduplicated results
- **Reading Progress Tracking:** Log current page, start/end dates, and page-by-page reading sessions to capture complete reading journey
- **Multi-Status Management:** Organize books by Want to Read, Reading, Completed, or DNF status
- **Format Support:** Track Physical, eBook, Audiobook, and Graphic Novel formats with acquisition method details

### Organization Features

- **Book Club Tracking:** Tag books with book club associations and maintain autocomplete history of past clubs
- **Readathon Integration:** Track readathon participation with usage-based autocomplete for event names
- **Smart Autocomplete:** System learns from your reading history to suggest previously used book clubs and readathons
- **Dashboard Layouts:** Toggle between grid and table views based on personal preference with persistent settings

### Analytics Features

- **Reading Volume Charts:** Visualize books completed per month with year-over-year comparisons
- **Pages Per Month:** Track reading volume by pages (excludes audiobooks)
- **Format Distribution:** See breakdown of physical vs digital vs audiobook reading habits
- **Genre Distribution:** Fiction vs non-fiction breakdown
- **Representation Stats:** LGBTQ+, disability representation, POC authors, new-to-user authors
- **Year Filtering:** Analyze reading patterns across different years with available data detection
- **Chart Data Caching:** 30-minute intelligent caching for fast analytics performance

### Social Features

- **Public Reviews:** Share individual reviews with customizable privacy controls
- **Shareable Images:** Auto-generated review images for social media
- **Public Profiles:** Optional public reading profile pages

### Advanced Features

- **Edition Management:** Track multiple editions (hardcover, paperback, international) of the same book without duplication
- **Book Type Auto-Detection:** Automatically classify fiction vs non-fiction based on Google Books categories for appropriate rating facets
- **Google Books Enrichment:** Automatically pull cover images, descriptions, page counts, and metadata from Google Books API
- **Admin Panel:** User management and book data administration
- **Admin Audit Trail:** Complete logging of all administrative actions with before/after values for accountability
