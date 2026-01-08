# Manual Testing Checklist: Social Sharing Feature

**Date:** 2026-01-08
**Feature:** Social Sharing of Reviews
**Test Environment:** Development (localhost:3000)

## Prerequisites
- User account created and authenticated
- At least one completed book with CAWPILE rating in library
- Multiple browsers available (Chrome, Firefox, Safari)
- Mobile device or browser dev tools for responsive testing

---

## Test Case 1: Share Creation from Dashboard

**Goal:** Verify users can create a share link for completed books with ratings

### Steps:
1. Log in to dashboard
2. Locate a completed book with CAWPILE rating
3. Click kebab menu (three dots) on book card
4. Verify "Share Review" option is visible
5. Click "Share Review"
6. Verify ShareReviewModal opens

### Expected Results:
- [ ] Share button only visible for COMPLETED books with ratings
- [ ] Modal opens with book title and cover
- [ ] Privacy toggles visible and checked by default
- [ ] "Create Share Link" button visible

---

## Test Case 2: Share Link Generation and Clipboard Copy

**Goal:** Verify share link is generated and copied to clipboard

### Steps:
1. In ShareReviewModal, click "Create Share Link"
2. Wait for link generation
3. Verify share URL displayed in read-only input
4. Click copy button (clipboard icon)
5. Verify success feedback message

### Expected Results:
- [ ] Share link generated within 1-2 seconds
- [ ] Share URL format: `http://localhost:3000/share/reviews/[token]`
- [ ] Token is at least 21 characters, URL-safe
- [ ] Link copied to clipboard (can paste into browser)
- [ ] Success message: "Link copied to clipboard" displayed

---

## Test Case 3: Public Review Page - Full Content Display

**Goal:** Verify public page displays all content with default privacy settings

### Steps:
1. Copy share URL from previous test
2. Open new incognito/private browser window
3. Paste share URL into address bar
4. Navigate to URL

### Expected Results:
- [ ] Page loads without authentication prompt
- [ ] Book cover image displayed
- [ ] Book title and authors displayed
- [ ] All 7 CAWPILE rating facets displayed with scores
- [ ] Overall score, star rating, and grade displayed
- [ ] Review text displayed (if exists)
- [ ] Reading dates displayed (start and finish)
- [ ] Book club name displayed (if exists)
- [ ] Readathon name displayed (if exists)
- [ ] "Powered by Cawpile" footer displayed
- [ ] Dark mode styling works correctly

---

## Test Case 4: Privacy Toggle - Hide Reading Dates

**Goal:** Verify privacy toggle updates are reflected on public page

### Steps:
1. Return to dashboard (authenticated window)
2. Open ShareReviewModal for same book
3. Uncheck "Show reading dates" toggle
4. Click "Update Settings"
5. Refresh public page in incognito window

### Expected Results:
- [ ] Update completes successfully
- [ ] Success message displayed
- [ ] Reading dates section no longer visible on public page
- [ ] All other content still displayed

---

## Test Case 5: Privacy Toggle - Hide All Optional Fields

**Goal:** Verify all privacy toggles work correctly

### Steps:
1. In ShareReviewModal, uncheck all privacy toggles:
   - [ ] Show reading dates
   - [ ] Show book clubs
   - [ ] Show readathons
2. Click "Update Settings"
3. Refresh public page

### Expected Results:
- [ ] "Reading Details" section completely hidden
- [ ] Book metadata and CAWPILE rating still displayed
- [ ] Review text still displayed
- [ ] Page layout remains clean without metadata section

---

## Test Case 6: Share Deletion

**Goal:** Verify share can be deleted and URL becomes invalid

### Steps:
1. In ShareReviewModal, click "Delete Share"
2. Confirm deletion in browser prompt
3. Wait for confirmation message
4. Attempt to access share URL in incognito window

### Expected Results:
- [ ] Confirmation prompt appears
- [ ] Share deleted successfully
- [ ] Success message displayed
- [ ] Modal closes automatically
- [ ] Share URL returns 404 error page
- [ ] Share button visible again in kebab menu

---

## Test Case 7: Share Button Visibility Logic

**Goal:** Verify share button only appears for eligible books

### Test Books:
- Book A: Status = READING, Has rating
- Book B: Status = COMPLETED, No rating
- Book C: Status = COMPLETED, Has rating
- Book D: Status = WANT_TO_READ, Has rating

### Expected Results:
- [ ] Book A: Share button NOT visible (not completed)
- [ ] Book B: Share button NOT visible (no rating)
- [ ] Book C: Share button VISIBLE (eligible)
- [ ] Book D: Share button NOT visible (not completed)

---

## Test Case 8: Cross-Browser Testing

**Goal:** Verify feature works across major browsers

### Browsers to Test:
1. Chrome/Chromium
2. Firefox
3. Safari

### For Each Browser:
- [ ] Create share from dashboard
- [ ] Clipboard copy works
- [ ] Public page displays correctly
- [ ] Privacy toggles update correctly
- [ ] Share deletion works

### Expected Results:
- [ ] Feature works consistently across all browsers
- [ ] No visual layout issues
- [ ] No JavaScript errors in console

---

## Test Case 9: Mobile Responsive Testing

**Goal:** Verify layout works on mobile devices

### Test Devices/Viewports:
- iPhone (375px width)
- Android phone (360px width)
- Tablet (768px width)

### Steps:
1. Open public share URL on mobile device or use browser dev tools
2. Test at different orientations (portrait/landscape)

### Expected Results:
- [ ] Book cover scales appropriately
- [ ] Text remains readable
- [ ] CAWPILE rating facets display cleanly
- [ ] No horizontal scrolling required
- [ ] Buttons and interactive elements are touch-friendly
- [ ] ShareReviewModal is usable on mobile

---

## Test Case 10: Share Re-Creation (Duplicate Prevention)

**Goal:** Verify duplicate shares return existing share

### Steps:
1. Create share for a completed book
2. Note the share URL/token
3. Close modal
4. Open kebab menu again and click "Share Review"
5. Observe if "Create Share Link" or existing URL displayed

### Expected Results:
- [ ] Existing share URL displayed immediately
- [ ] Same token as before (not a new one)
- [ ] Privacy settings preserved from previous share
- [ ] No duplicate shares created in database

---

## Test Case 11: Invalid Share Token Handling

**Goal:** Verify graceful error handling for invalid tokens

### Steps:
1. Manually modify share URL token in address bar
2. Add invalid characters or shorten token
3. Navigate to modified URL

### Expected Results:
- [ ] 404 error page displayed
- [ ] No server error or crash
- [ ] Error message is user-friendly

---

## Test Case 12: Performance Validation

**Goal:** Verify acceptable performance

### Metrics to Check:
- [ ] Public page loads in < 2 seconds
- [ ] Clipboard copy is instant
- [ ] Share creation completes in < 2 seconds
- [ ] Privacy toggle updates in < 1 second
- [ ] No N+1 query issues (check server logs)
- [ ] No JavaScript console errors

---

## Test Case 13: SEO and Metadata

**Goal:** Verify page metadata is correct

### Steps:
1. View page source of public share URL
2. Check meta tags

### Expected Results:
- [ ] Page title: `{Book Title} - Review | Cawpile`
- [ ] Meta description includes book title
- [ ] `robots` tag set to `noindex, nofollow`
- [ ] No sensitive user data in meta tags

---

## Summary

**Total Test Cases:** 13
**Priority Level:**
- Critical (must pass): Cases 1, 2, 3, 6
- Important (should pass): Cases 4, 5, 7, 8
- Nice-to-have: Cases 9, 10, 11, 12, 13

**Test Completion Date:** _____________

**Tested By:** _____________

**Notes/Issues Found:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
