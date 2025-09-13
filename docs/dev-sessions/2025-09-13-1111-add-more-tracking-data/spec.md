# Development Session Specification

**Session**: 2025-09-13-1111-add-more-tracking-data
**Branch**: main
**Purpose**: Add enhanced optional tracking fields to the Cawpile book tracking application

## Objectives

Add comprehensive optional tracking fields to capture more context about users' reading experiences, including acquisition methods, reading contexts, representation metrics, and author diversity information.

## Success Criteria

1. Users can optionally track 9 new data points about their books
2. Data entry occurs at appropriate points in the user journey (book addition, completion, DNF)
3. All fields are optional and don't disrupt existing workflows
4. Users can edit tracking data after initial entry
5. Autocomplete functionality improves data consistency for club/read-a-thon names

## Scope

### New Tracking Fields

#### When Adding a Book (4 fields)
1. **Acquisition Method** - How the book was obtained
   - Options: Purchased, Library, Friend Borrowed, Gift, Other (free-form, 100 char)

2. **Book Club** - Whether book is for a book club
   - Yes/No selection
   - If Yes: Book club name field (100 char, autocomplete from user's previous entries)

3. **Read-a-thon** - Whether book is for a read-a-thon
   - Yes/No selection
   - If Yes: Read-a-thon name field (100 char, autocomplete from user's previous entries)

4. **Re-read Status** - Whether this is a re-read
   - Yes/No selection

#### When Marking as DNF (1 field)
5. **DNF Reason** - Why the book wasn't finished
   - Optional free-form text field (500 char)
   - Appears when status changed to DNF

#### After CAWPILE Rating Completion (4 fields via "Additional Details" wizard)
6. **LGBTQ+ Representation**
   - Radio buttons: Yes/No/Unknown
   - Optional details field (500 char, always visible/enabled)

7. **Disability Representation**
   - Radio buttons: Yes/No/Unknown
   - Optional details field (500 char, always visible/enabled)

8. **New Author** - Whether this is a new author for the user
   - Yes/No selection

9. **Author Person of Color**
   - Radio buttons: Yes/No/Unknown
   - Optional nationality/ethnicity field (200 char, always visible/enabled)

## Technical Requirements

### Database Schema Updates
- Add new columns to `UserBook` table for all tracking fields
- Create new tables for storing user's book clubs and read-a-thons for autocomplete
- Ensure all fields are nullable for backward compatibility

### UI Components
1. **Book Addition Modal** - Extend with 4 new optional fields
2. **Status Update Component** - Add DNF reason field when DNF selected
3. **Additional Details Wizard** - New multi-step wizard component after rating
4. **Edit Interface** - Allow editing all tracking fields from book details page

### API Endpoints
- Update existing book creation/update endpoints to handle new fields
- Add endpoints for fetching user's previous club/read-a-thon names for autocomplete
- Ensure validation respects character limits

### Data Validation
- Acquisition Method: Enum validation + optional "Other" text (100 char)
- Book Club Name: Max 100 characters
- Read-a-thon Name: Max 100 characters
- DNF Reason: Max 500 characters
- LGBTQ+ Details: Max 500 characters
- Disability Details: Max 500 characters
- Author POC Details: Max 200 characters

### User Experience Flow
1. **Adding a book**: Present 4 optional fields in existing modal/form
2. **Marking as DNF**: Show optional reason field in status change flow
3. **After rating**: Display "Additional Details" button → Launch 4-step wizard
4. **Editing**: Access all fields from book details/edit page

## Out of Scope (Future Enhancements)
- Reporting/statistics based on tracking data
- Filtering library by tracking fields
- Sharing tracking data with other users
- Global autocomplete across all users
- Export functionality for tracking data
- Bulk editing of tracking fields
