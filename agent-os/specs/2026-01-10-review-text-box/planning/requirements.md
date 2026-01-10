# Spec Requirements: Review Text Box

## Initial Description
Add a review text box feature to the CAWPILE rating wizard that allows users to write optional qualitative reviews for books in addition to the quantitative CAWPILE ratings.

## Requirements Discussion

### First Round Questions

**Q1: Where should the review text box appear in the user flow?**
**Answer:** Add review text box in the Additional Details section of the rating wizard (where LGBTQ+ and disability visibility options are)

**Q2: What database changes are needed?**
**Answer:** Use existing `review` field in UserBook model (String?, @db.Text) - NO DATABASE MIGRATION NEEDED

**Q3: What are the constraints for the review text?**
**Answer:** 5,000 characters maximum

**Q4: What type of text editor should be used?**
**Answer:** Plain text textarea (no formatting) with character counter

**Q5: Is the review field required or optional?**
**Answer:** Completely optional - empty field is allowed, no validation errors

**Q6: Where should reviews be displayed?**
**Answer:**
- View details modal on dashboard
- Shared review feature (optional inclusion)

**Q7: Can users edit reviews after creation?**
**Answer:** Editable through Edit Book functionality

**Q8: How does this relate to the CAWPILE rating system?**
**Answer:** Separate and additional to CAWPILE rating system (qualitative vs quantitative)

**Q9: What happens to review text when book status changes?**
**Answer:** Review text persists when book status changes

**Q10: Are there privacy considerations for reviews?**
**Answer:** Review can be optionally shared via the shared review feature

### Existing Code to Reference

**Similar Features Identified:**
- Rating wizard with Additional Details section exists
- Shared review feature already implemented
- UserBook.review field exists but unused in UI
- View details modal structure exists

### Follow-up Questions
No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
No visual assets to analyze.

## Requirements Summary

### Functional Requirements
- Add textarea input field in rating wizard's Additional Details section
- Integrate with existing UserBook.review database field
- Implement 5,000 character limit with live counter
- Display review text in view details modal
- Allow review editing through existing Edit Book flow
- Support optional inclusion in shared review feature
- Persist review text across book status changes
- No validation requirements (completely optional field)

### Reusability Opportunities
- Existing rating wizard structure can accommodate new field
- Shared review feature already has infrastructure for text display
- View details modal pattern can be extended
- Edit Book functionality can handle review updates
- UserBook model already includes review field

### Scope Boundaries

**In Scope:**
- Add review textarea to rating wizard Additional Details section
- Implement character counter (5,000 max)
- Display review in view details modal
- Enable review editing via Edit Book
- Support optional sharing via shared review feature
- Persist review across status changes

**Out of Scope:**
- Rich text formatting (plain text only)
- Database schema changes (field already exists)
- Review moderation or filtering
- Review ratings or voting systems
- Public review feed or discovery
- Review templates or prompts
- AI-assisted review writing
- Review analytics or insights

### Technical Considerations
- Database field already exists: `UserBook.review` (String?, @db.Text)
- No migration needed
- Plain textarea component (no rich text editor)
- Character counting logic required
- Integration with existing wizard flow
- Integration with shared review feature
- Integration with view details modal
- Integration with Edit Book functionality
- Optional field handling in all contexts
