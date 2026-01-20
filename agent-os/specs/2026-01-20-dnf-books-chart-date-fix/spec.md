# Specification: DNF Books Chart Date Fix

## Goal
Enable DNF (Did Not Finish) books to appear in charts by ensuring they have a `finishDate` set, and allow users to specify/edit the DNF date.

## User Stories
- As a reader, I want my DNF'd books to appear in my reading charts so that I have accurate statistics about my reading habits
- As a reader, I want to specify when I DNF'd a book so that my charts reflect the correct month

## Specific Requirements

**Database Migration for Existing DNF Books**
- Create a SQL migration that updates all existing UserBook records where `status = 'DNF'` and `finishDate IS NULL`
- Set `finishDate` to the record's `updatedAt` value as the best available approximation
- Migration should be idempotent (safe to run multiple times)

**Auto-Set finishDate When Marking as DNF**
- In `PATCH /api/user/books/[id]`, when status changes to `DNF` and no `finishDate` is provided, auto-set to current date
- Follow existing pattern at lines 139-148 that handles COMPLETED and READING status transitions
- Only set if `finishDate` is not already present and not being explicitly provided in the request

**AddBookWizard DNF Date Collection**
- When user selects "No, I did not finish (DNF)" at step 4 (completion question), show a date picker
- Default the date picker to today's date
- Use the same date input styling as the existing finish date picker (lines 385-392)
- Pass `finishDate` in the POST request body when DNF is selected

**MarkDNFModal Date Collection**
- Add a date picker to the existing MarkDNFModal component
- Default to today's date using the same pattern as MarkCompleteModal (lines 28-53)
- Include the selected date when calling `onDNF` callback
- Use same styling as MarkCompleteModal's date input

**EditBookModal DNF Date Editing**
- In the Basic Info tab, when status is DNF, show a date picker labeled "DNF Date"
- Load the current `finishDate` as the initial value
- Include `finishDate` in the PATCH request body
- Position the field after the DNF Reason textarea (around line 261)

**Pages Chart DNF Handling**
- Modify the pages-per-month API route to calculate pages read for DNF books based on progress
- Formula: `pages = pageCount * (progress / 100)`
- Only include DNF books where `progress > 0` (exclude 0% progress DNF books from pages chart)
- Round the calculated pages to nearest integer

## Existing Code to Leverage

**MarkCompleteModal Date Handling Pattern**
- Use the date defaulting logic from `MarkCompleteModal.tsx` lines 28-53 for consistent UX
- Copy the date input styling and min/max date constraints
- Follow the same `useEffect` pattern for setting default date when modal opens

**Status Change Logic in PATCH Route**
- Extend the existing status transition handling at `route.ts` lines 139-148
- Follow the pattern: check status change, check if date missing, auto-set if needed
- Keep the conditional structure consistent with COMPLETED and READING handlers

**AddBookWizard Step 4 Structure**
- The "Did you finish?" question already exists at lines 352-396
- The DNF date picker should appear as a sibling to the existing finish date picker (lines 380-394)
- Wrap in a conditional that shows when `formData.didFinish === false`

**Prisma Migration Pattern**
- Follow naming convention from existing migrations: `YYYYMMDDHHMMSS_descriptive_name`
- Use raw SQL for data updates: `UPDATE "public"."UserBook" SET ...`
- Reference `20260117041309_add_user_settings_fields` for single-statement migration format

**MarkDNFModal Structure**
- Modal already has textarea for DNF reason with character counter
- Add date picker above or below the DNF reason field
- Follow same form field structure as MarkCompleteModal

## Out of Scope
- Changes to chart API query logic (not needed - charts already filter by finishDate)
- Changes to available-years route (already considers both dates)
- Adding DNF-specific charts or analytics
- Modifying how progress percentage is stored or calculated
- Adding validation for DNF date vs start date relationship
- Batch editing of DNF dates for multiple books
- Import/export of DNF date data
- Email notifications for DNF milestones
- DNF date in shared reviews or public profiles
- Reading session integration with DNF tracking
