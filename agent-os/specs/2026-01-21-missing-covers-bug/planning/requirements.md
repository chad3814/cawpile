# Spec Requirements: Missing Covers Bug

## Initial Description
Bug: missing or bad covers are shown in the library. We can't do anything right now about bad covers (future feature fix), but if there's a cover shown in the search modal, there should be a cover in the library.

## Requirements Discussion

### First Round Questions

**Q1:** Should we use multi-provider fallback logic (Hardcover > Google > IBDB) for displaying covers in the library, similar to how search results work?
**Answer:** Use multi-provider fallback logic (Hardcover > Google > IBDB) for displaying covers - CONFIRMED

**Q2:** Should the LocalDatabaseProvider be fixed to include imageUrl from the database when returning search results?
**Answer:** Fix LocalDatabaseProvider to include imageUrl from DB - YES, IN SCOPE

**Q3:** For existing books in users' libraries that have missing covers, should we implement a data migration to backfill cover URLs, or handle it at display time with fallback logic?
**Answer:** DATA MIGRATION approach for existing books with missing covers

**Q4:** Should the search result merging logic be modified to prioritize cover URLs from certain providers?
**Answer:** Don't modify search result merging logic - CONFIRMED

**Q5:** Are there specific test cases or books where this issue is reproducible?
**Answer:** Test cases provided:
- "Cursed Cocktails" ISBN-13: 9798987850206
- "The Halfling's Harvest" ISBN-13: 9781964567136

**Q6:** What should be excluded from this fix (e.g., bad cover quality improvements)?
**Answer:** Only what's stated above is in scope. Bad cover quality improvements are explicitly out of scope (future feature).

### Existing Code to Reference
No similar existing features identified for reference.

### Follow-up Questions
None required - answers were comprehensive.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- Implement multi-provider fallback logic (Hardcover > Google > IBDB) for displaying book covers in the library
- Fix LocalDatabaseProvider to include imageUrl from the database when returning search results
- Create data migration to backfill cover URLs for existing books that have missing covers

### Reusability Opportunities
- The existing search provider infrastructure (SearchOrchestrator, providers) can inform the cover fallback implementation
- The existing data migration patterns in Prisma can be followed

### Scope Boundaries
**In Scope:**
- Multi-provider fallback logic for cover display (Hardcover > Google > IBDB)
- LocalDatabaseProvider fix to include imageUrl from DB
- Data migration for existing books with missing covers

**Out of Scope:**
- Bad cover quality improvements (future feature)
- Modifications to search result merging logic

### Technical Considerations
- Test with specific books: "Cursed Cocktails" (ISBN: 9798987850206) and "The Halfling's Harvest" (ISBN: 9781964567136)
- Cover fallback order: Hardcover > Google > IBDB
- Data migration should handle existing library entries that lack cover URLs
