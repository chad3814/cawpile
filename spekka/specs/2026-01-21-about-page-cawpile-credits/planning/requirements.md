# Spec Requirements: About Page & CAWPILE Credits

## Initial Description

Create an About page that credits Book Roast (the YouTube creator who invented the CAWPILE rating system) and enhance the homepage with CAWPILE explanation content and example charts.

## Requirements Discussion

### First Round Questions

**Q1:** About page location and navigation - Should the About page be accessible from the main navigation, footer, or both? And should it be available to signed-out users or only authenticated users?
**Answer:** Footer link, available signed in or out

**Q2:** Book Roast credit content - What specific elements should be included in the Book Roast credit section?
**Answer:** Include all of:
- The YouTube channel name and link (https://www.youtube.com/@BookRoast)
- A brief explanation that CAWPILE was created by Book Roast
- What CAWPILE stands for (Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment)
- A link to her CAWPILE playlist: https://www.youtube.com/playlist?list=PL3V6H7y0QuPPNa_DRxClpQ5XU1E-vZpJA

**Q3:** Homepage CAWPILE section scope - For the CAWPILE explanation on the homepage, what level of detail should be included?
**Answer:** Yes to all:
- Include the full breakdown of all 7 facets with their descriptions
- Show both the Fiction and Non-Fiction variations of the facets
- Include the rating scale guide (1-10 with meanings)
- Position: Above the existing features, replacing/augmenting the "Track Your Reading Journey" section

**Q4:** Example charts on homepage - Which charts should be shown and how should they behave?
**Answer:**
- Smaller versions of "Books per Month", "Book Format" and "Pages per Month" charts
- Yes interactive like on the charts tab (with hoverable tooltips)
- Use sample/demo data (not real user data)

**Q5:** What should be explicitly excluded from this feature?
**Answer:** Include only the above, nothing else

### Existing Code to Reference

No similar existing features identified for reference. However, the following existing code will be relevant:
- Existing homepage: `src/app/page.tsx`
- Chart components: `src/components/charts/`
- Footer component: `src/components/layout/` (if exists)
- CAWPILE rating types: `src/types/cawpile.ts`

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements

**About Page:**
- Create a new `/about` route accessible to all users (authenticated and unauthenticated)
- Add footer link to the About page
- Display Book Roast credit section with:
  - YouTube channel name with link to https://www.youtube.com/@BookRoast
  - Brief explanation that CAWPILE was created by Book Roast
  - CAWPILE acronym breakdown (Characters, Atmosphere, Writing, Plot, Intrigue, Logic, Enjoyment)
  - Link to CAWPILE playlist: https://www.youtube.com/playlist?list=PL3V6H7y0QuPPNa_DRxClpQ5XU1E-vZpJA

**Homepage CAWPILE Section:**
- Add comprehensive CAWPILE explanation section
- Position above existing features (replace/augment "Track Your Reading Journey" section)
- Include full breakdown of all 7 facets with descriptions
- Show both Fiction and Non-Fiction facet variations
- Include rating scale guide (1-10 with meanings)

**Homepage Example Charts:**
- Add smaller versions of three charts:
  - Books per Month
  - Book Format
  - Pages per Month
- Make charts interactive with hoverable tooltips
- Use sample/demo data (not real user data)

### Reusability Opportunities

- Existing chart components from `src/components/charts/` can be adapted for homepage display
- CAWPILE facet definitions may already exist in `src/types/cawpile.ts` or related files
- Existing Recharts patterns from the Charts tab

### Scope Boundaries

**In Scope:**
- New About page at `/about` route
- Footer link to About page
- Book Roast credit content with YouTube links
- CAWPILE acronym and facet explanations
- Fiction vs Non-Fiction facet variations
- Rating scale guide (1-10)
- Three example charts on homepage with demo data
- Interactive chart tooltips

**Out of Scope:**
- Any additional pages or features beyond About page and homepage enhancements
- Real user data on homepage charts
- Additional chart types beyond the three specified
- Contact forms or feedback mechanisms
- User preferences for About page content
- Social media links beyond the specified YouTube links

### Technical Considerations

- About page should work without authentication (public route)
- Homepage charts need sample/demo data generation
- Charts should be smaller/responsive versions of existing chart components
- Footer component may need to be created or updated to include About link
- CAWPILE facet content should be consistent with existing rating system implementation
