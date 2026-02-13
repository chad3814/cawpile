# Task Breakdown: Template Repository

## Overview
Total Tasks: 38

This feature adds a template browsing and selection system that allows authenticated users to browse published video templates, select one for their monthly recap, and duplicate templates for personal use. Admins retain exclusive template creation privileges while all authenticated users gain browsing access.

## Task List

### Database Layer

#### Task Group 1: Schema Changes and Migration
**Dependencies:** None

- [x] 1.0 Complete database schema changes
  - [x] 1.1 Write 4 focused tests for the new schema fields and relations
    - Test that VideoTemplate can be created with `userId`, `isPublished`, and `usageCount` fields
    - Test that User `selectedTemplateId` relation works (set and clear)
    - Test that deleting a VideoTemplate sets the User's `selectedTemplateId` to null (onDelete: SetNull)
    - Test that the creator relation between VideoTemplate and User resolves correctly
  - [x] 1.2 Update VideoTemplate model in `prisma/schema.prisma`
    - Add `userId` (String, optional/nullable) with relation to User
    - Add `isPublished` (Boolean, default false)
    - Add `usageCount` (Int, default 0)
    - Add `creator` relation field: `creator User? @relation("CreatedTemplates", fields: [userId], references: [id], onDelete: SetNull)`
    - Add `selectedByUsers` back-relation: `selectedByUsers User[] @relation("SelectedTemplate")`
    - Add `@@index([isPublished, createdAt])` for efficient browse queries
  - [x] 1.3 Update User model in `prisma/schema.prisma`
    - Add `selectedTemplateId` (String, optional/nullable)
    - Add `selectedTemplate` relation: `selectedTemplate VideoTemplate? @relation("SelectedTemplate", fields: [selectedTemplateId], references: [id], onDelete: SetNull)`
    - Add `createdTemplates` back-relation: `createdTemplates VideoTemplate[] @relation("CreatedTemplates")`
  - [x] 1.4 Create Prisma migration
    - Run `npx prisma migrate dev --name add-template-repository-fields`
    - Verify migration is additive-only (no data migration needed)
    - Confirm existing VideoTemplate records remain valid with `userId = null`
  - [x] 1.5 Ensure database layer tests pass
    - Run ONLY the 4 tests written in 1.1
    - Verify migration applies cleanly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4 tests written in 1.1 pass
- Migration runs successfully without affecting existing data
- `userId` is nullable, allowing existing templates to remain as system templates
- `selectedTemplateId` on User has `onDelete: SetNull` behavior
- Composite index on `[isPublished, createdAt]` exists for query performance

---

### API Layer: Admin Route Extensions

#### Task Group 2: Extend Existing Admin Template API Routes
**Dependencies:** Task Group 1

- [x] 2.0 Complete admin API route extensions
  - [x] 2.1 Write 5 focused tests for admin API changes
    - Test `GET /api/templates` returns templates with `creator` info (name, image) included
    - Test `GET /api/templates` supports `isPublished` query parameter filtering
    - Test `POST /api/templates` auto-sets `userId` to the creating admin's ID and accepts `isPublished`
    - Test `PATCH /api/templates/[id]` accepts and persists `isPublished` field changes
    - Test `PATCH /api/templates/[id]` audit logs `isPublished` changes via `logFieldChanges`
  - [x] 2.2 Extend `GET /api/templates` in `src/app/api/templates/route.ts`
    - Add optional `isPublished` query parameter to filter (`true`/`false` string)
    - Include `creator` relation in the query: `include: { creator: { select: { name: true, image: true } } }`
    - Continue returning all templates (published and unpublished) when no filter is set
    - Maintain existing pagination (limit/offset) support
  - [x] 2.3 Extend `POST /api/templates` in `src/app/api/templates/route.ts`
    - Accept optional `isPublished` field in the request body
    - Auto-set `userId` to `user.id` (the creating admin) in the Prisma `create` call
    - Include `isPublished` in the audit log `newValue`
  - [x] 2.4 Extend `PATCH /api/templates/[id]` in `src/app/api/templates/[id]/route.ts`
    - Accept `isPublished` (Boolean) in the update body
    - Add `isPublished` to the `updateData` object when provided
    - Track `isPublished` changes in the `changes` object for `logFieldChanges`
  - [x] 2.5 Ensure admin API tests pass
    - Run ONLY the 5 tests written in 2.1
    - Verify existing admin CRUD operations still work
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 5 tests written in 2.1 pass
- Admin GET endpoint includes creator info and supports isPublished filtering
- Admin POST auto-assigns userId to the creating admin
- Admin PATCH handles isPublished updates with proper audit logging
- No breaking changes to existing admin functionality

---

### API Layer: User-Facing Routes

#### Task Group 3: User Template Browse and Action APIs
**Dependencies:** Task Group 1

- [x] 3.0 Complete user-facing template API routes
  - [x] 3.1 Write 8 focused tests for user template API endpoints
    - Test `GET /api/user/templates` returns only published templates (never unpublished)
    - Test `GET /api/user/templates` pagination with `limit` and `offset` parameters
    - Test `GET /api/user/templates` sorting by `newest`, `name`, and `popular`
    - Test `GET /api/user/templates` search filtering by template name (case-insensitive)
    - Test `GET /api/user/templates/[id]` returns 404 for unpublished or nonexistent templates
    - Test `POST /api/user/templates/[id]/select` sets user's `selectedTemplateId` and increments `usageCount`
    - Test `POST /api/user/templates/[id]/select` is idempotent (does not double-increment usageCount on re-select)
    - Test `POST /api/user/templates/[id]/duplicate` creates a personal copy with correct fields
  - [x] 3.2 Create `GET /api/user/templates/route.ts` (browse endpoint)
    - Require authenticated user via `getCurrentUser()` from `src/lib/auth-helpers.ts`
    - Query only `isPublished = true` templates
    - Support `limit` (default 12), `offset` (default 0) query parameters for pagination
    - Support `sort` query parameter: `newest` (createdAt desc, default), `name` (name asc), `popular` (usageCount desc)
    - Support `search` query parameter: case-insensitive `contains` filter on template `name`
    - Include `creator: { select: { name: true, image: true } }` in the query
    - Return `{ templates, totalCount, selectedTemplateId }` response shape
    - Fetch user's `selectedTemplateId` from the User record to include in response metadata
  - [x] 3.3 Create `GET /api/user/templates/[id]/route.ts` (detail endpoint)
    - Require authenticated user via `getCurrentUser()`
    - Find template by ID where `isPublished = true`
    - Return 404 if not found or not published (do not distinguish)
    - Include `creator: { select: { name: true, image: true } }` and full `config` JSON
    - Return `{ template }` response shape
  - [x] 3.4 Create `POST /api/user/templates/[id]/select/route.ts` (select endpoint)
    - Require authenticated user via `getCurrentUser()`
    - Verify template exists and `isPublished = true`; return 404 otherwise
    - Check if user already has this template selected (compare `user.selectedTemplateId` with param ID via a fresh User query)
    - If already selected: update `selectedTemplateId` (no-op) and return success without incrementing `usageCount`
    - If not already selected: use `prisma.$transaction` or sequential updates to set `user.selectedTemplateId` and atomically `increment` the template's `usageCount`
    - Return `{ success: true, selectedTemplateId }` response shape
  - [x] 3.5 Create `POST /api/user/templates/[id]/duplicate/route.ts` (duplicate endpoint)
    - Require authenticated user via `getCurrentUser()`
    - Verify source template exists and `isPublished = true`; return 404 otherwise
    - Deep copy the source template's `config` JSON using `JSON.parse(JSON.stringify(...))`
    - Validate the copied config with `validateTemplateConfig` as a safeguard
    - Create new VideoTemplate record with: `userId` = current user ID, `isPublished = false`, `name` = `"Copy of [original name]"`, `config` = deep copy, `description` = copied, `previewThumbnailUrl` = copied, `usageCount = 0`
    - Return `{ template }` with the newly created record (status 201)
  - [x] 3.6 Ensure user API tests pass
    - Run ONLY the 8 tests written in 3.1
    - Verify all user-facing endpoints enforce authentication
    - Verify unpublished templates are never exposed
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 8 tests written in 3.1 pass
- Browse endpoint returns only published templates with pagination, sorting, and search
- Detail endpoint returns full template info or 404 for unpublished/missing
- Select endpoint is idempotent and uses atomic increment for usageCount
- Duplicate endpoint creates a valid personal copy with config validation
- All endpoints require authentication but not admin privileges

---

### Frontend: Browse Page and Components

#### Task Group 4: Template Browse Page Shell and Grid
**Dependencies:** Task Groups 2, 3

- [x] 4.0 Complete browse page and template card components
  - [x] 4.1 Write 4 focused tests for browse page UI components
    - Test TemplateCard renders name, creator name (or "System" for null creator), and color swatches
    - Test TemplateCard shows "Selected" indicator when the template matches `selectedTemplateId`
    - Test TemplateBrowseClient renders grid of cards and handles empty state
    - Test TemplateBrowseClient search input triggers debounced API refetch
  - [x] 4.2 Create server component page shell at `src/app/dashboard/templates/page.tsx`
    - Fetch current user via `getCurrentUser()` from `src/lib/auth-helpers.ts`
    - Redirect unauthenticated users to sign-in (use `redirect()` from `next/navigation`)
    - Fetch user's `selectedTemplateId` from the database
    - Render `TemplateBrowseClient` client component, passing `selectedTemplateId` and user ID as props
  - [x] 4.3 Create `TemplateCard` component at `src/components/templates/TemplateCard.tsx`
    - Client component (`"use client"`)
    - Props: template data (id, name, previewThumbnailUrl, config, creator), isSelected boolean
    - Display: preview thumbnail image with placeholder fallback (gray background with icon), template name, creator name (show "System" when `creator` is null)
    - Color swatches: extract `background`, `accent`, `textPrimary`, `accentSecondary` from `config.global.colors` and render as small circular swatches (3-5 colors)
    - Selected state: highlight border or checkmark badge when `isSelected` is true
    - Entire card is a link to `/dashboard/templates/[id]`
    - Follow TailwindCSS 4 dark mode patterns (`prefers-color-scheme`)
  - [x] 4.4 Create `TemplateBrowseClient` component at `src/components/templates/TemplateBrowseClient.tsx`
    - Client component (`"use client"`)
    - State: `search` (string), `sort` (enum: newest/name/popular), `page` (number), `templates` (array), `totalCount` (number), `selectedTemplateId` (string or null), `myTemplates` (array), `loading` (boolean)
    - Fetch templates from `GET /api/user/templates` on mount and when search/sort/page changes
    - Fetch user's personal templates (where `userId = currentUserId`) from a separate API call or include in the browse response
    - Search input: debounced (300ms) using `useDebounce` hook pattern, resets pagination to page 1
    - Sort dropdown: options for "Newest", "Name (A-Z)", "Most Popular"
    - Responsive grid layout: 3 columns on desktop (lg), 2 on tablet (md), 1 on mobile
    - Render `TemplateCard` for each template in the grid
    - Show loading skeleton/spinner during API fetches
    - Show empty state message when no templates match search/filters
  - [x] 4.5 Implement "My Templates" section in `TemplateBrowseClient`
    - Above the public repository grid, render a "My Templates" section
    - Only visible when the user has at least one personal (duplicated) template
    - Fetch personal templates where `userId = currentUser.id` and `isPublished = false`
    - Use the same `TemplateCard` component for personal template cards
    - Personal templates can also be selected via the same select flow
  - [x] 4.6 Integrate Pagination component
    - Adapt `src/components/admin/Pagination.tsx` or create a styled variant for the user-facing browse page
    - Wire up page/limit state from `TemplateBrowseClient` to the Pagination component
    - Ensure dark mode compatibility with TailwindCSS 4 styling
    - Default to 12 items per page
  - [x] 4.7 Ensure browse page tests pass
    - Run ONLY the 4 tests written in 4.1
    - Verify components render correctly
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4 tests written in 4.1 pass
- Server component page shell authenticates and redirects properly
- Template cards display thumbnail, name, creator, color swatches, and selected state
- Browse grid is responsive (3/2/1 columns at desktop/tablet/mobile)
- Search, sort, and pagination work together correctly
- My Templates section appears only when user has personal copies

---

### Frontend: Template Detail Page

#### Task Group 5: Template Detail View and Actions
**Dependencies:** Task Group 4

- [x] 5.0 Complete template detail page with select and duplicate actions
  - [x] 5.1 Write 4 focused tests for template detail page
    - Test detail page renders template name, description, creator info, and color palette
    - Test "Select for My Recap" button calls the select API and updates UI state
    - Test "Duplicate" button calls the duplicate API and shows success confirmation
    - Test detail page shows 404/not-found state for invalid template IDs
  - [x] 5.2 Create server component page shell at `src/app/dashboard/templates/[id]/page.tsx`
    - Fetch current user via `getCurrentUser()`; redirect if unauthenticated
    - Fetch template details from the database (published only) with creator info
    - Return `notFound()` if template does not exist or is not published
    - Pass template data and user's `selectedTemplateId` to the client component
  - [x] 5.3 Create `TemplateDetailClient` component at `src/components/templates/TemplateDetailClient.tsx`
    - Client component (`"use client"`)
    - Display: template name, description, creator name and avatar image (or "System" for null creator)
    - Full-size preview thumbnail (with placeholder if null)
    - Complete color palette: render all color keys from `config.global.colors` as labeled swatches (label + colored circle for each key like "Background", "Accent", "Text Primary", etc.)
    - Font names: display `config.global.fonts` values (heading, body, mono)
    - Layout choices: list the layout value for each sequence section (intro, bookReveal, statsReveal, comingSoon, outro) from the config
    - Back navigation link to `/dashboard/templates`
  - [x] 5.4 Implement "Select for My Recap" button
    - Calls `POST /api/user/templates/[id]/select` on click
    - Shows loading state during the API call
    - On success: updates local state to show "Selected" indicator (e.g., button changes to "Currently Selected" with a checkmark)
    - If template is already the user's selected template, show the "Currently Selected" state on load
    - Handle error states (show a brief error message)
  - [x] 5.5 Implement "Duplicate" button
    - Calls `POST /api/user/templates/[id]/duplicate` on click
    - Shows loading state during the API call
    - On success: show a confirmation message (e.g., "Template duplicated! View in My Templates")
    - Optionally link to the browse page where My Templates section is visible
    - Handle error states
  - [x] 5.6 Ensure detail page tests pass
    - Run ONLY the 4 tests written in 5.1
    - Verify template details render correctly
    - Verify action buttons work as expected
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4 tests written in 5.1 pass
- Detail page displays all template information (name, description, creator, colors, fonts, layouts)
- Select button updates user's selected template and shows confirmation state
- Duplicate button creates a personal copy and shows success feedback
- Back navigation returns to the browse grid
- 404 handling works for nonexistent or unpublished templates

---

### Testing

#### Task Group 6: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-5

- [x] 6.0 Review existing tests and fill critical gaps only
  - [x] 6.1 Review tests from Task Groups 1-5
    - Review the 4 tests written for database schema (Task 1.1) at __tests__/database/templateRepository.test.ts
    - Review the 5 tests written for admin API extensions (Task 2.1) at __tests__/api/templates-extended.test.ts
    - Review the 8 tests written for user-facing API routes (Task 3.1) at __tests__/api/user/templates.test.ts
    - Review the 4 tests written for browse page UI (Task 4.1)
    - Review the 4 tests written for detail page UI (Task 5.1)
    - Total existing tests: 25 tests
  - [x] 6.2 Analyze test coverage gaps for this feature only
    - Identify critical user workflows that lack test coverage
    - Focus ONLY on gaps related to the template repository feature
    - Prioritize end-to-end workflows: browse -> select -> verify selection persists; browse -> duplicate -> verify personal copy appears in My Templates
    - Check for missing authentication guard tests across user API routes
    - Check for missing edge cases: selecting a template that gets deleted, duplicating with invalid config
  - [x] 6.3 Write up to 9 additional strategic tests maximum
    - Add integration test: full user flow of browsing, selecting, and verifying selection
    - Add integration test: duplicate flow creating a personal copy
    - Add test: unauthenticated access to user template API routes returns 401
    - Add test: `GET /api/user/templates` with `search` parameter returns filtered results
    - Add test: `GET /api/user/templates` response includes `selectedTemplateId` in metadata
    - Add test: `POST /api/user/templates/[id]/select` returns 404 for unpublished template
    - Add test: `POST /api/user/templates/[id]/duplicate` validates copied config
    - Add test: TemplateCard renders placeholder when `previewThumbnailUrl` is null
    - Add test: My Templates section hidden when user has no personal templates
  - [x] 6.4 Run feature-specific tests only
    - Run ONLY tests related to the template repository feature (tests from 1.1, 2.1, 3.1, 4.1, 5.1, and 6.3)
    - Expected total: approximately 34 tests
    - Do NOT run the entire application test suite
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 34 tests total)
- Critical user workflows are covered (browse, select, duplicate)
- Authentication enforcement is verified across all user API routes
- No more than 9 additional tests added when filling in gaps
- Testing focused exclusively on the template repository feature

---

## Execution Order

Recommended implementation sequence:

1. **Database Layer** (Task Group 1) -- Schema changes are the foundation for everything else. Must be completed first since all API routes and UI depend on the new fields and relations.

2. **Admin API Extensions** (Task Group 2) -- Extend existing admin routes to handle the new fields. This is a small, low-risk change that validates the schema works correctly with the existing admin flow.

3. **User-Facing API Routes** (Task Group 3) -- Build the new user-facing endpoints. Can be developed in parallel with Task Group 2 since they share the same database schema but operate on different route files. However, both depend on Task Group 1.

4. **Browse Page and Grid** (Task Group 4) -- Build the primary user-facing browse experience. Depends on the user API routes being functional for data fetching.

5. **Detail Page and Actions** (Task Group 5) -- Build the template detail view with select and duplicate actions. Depends on both the API routes (for action endpoints) and the browse page (for navigation context).

6. **Test Review and Gap Analysis** (Task Group 6) -- Final pass to review all tests, identify gaps, and add targeted tests for critical workflows. Must be last since it reviews tests from all prior groups.

## File Summary

New files to create:
- `src/app/api/user/templates/route.ts` (browse endpoint)
- `src/app/api/user/templates/[id]/route.ts` (detail endpoint)
- `src/app/api/user/templates/[id]/select/route.ts` (select endpoint)
- `src/app/api/user/templates/[id]/duplicate/route.ts` (duplicate endpoint)
- `src/app/api/user/templates/mine/route.ts` (personal templates endpoint)
- `src/app/dashboard/templates/page.tsx` (browse page shell)
- `src/app/dashboard/templates/[id]/page.tsx` (detail page shell)
- `src/components/templates/TemplateCard.tsx` (card component)
- `src/components/templates/TemplateBrowseClient.tsx` (browse grid client component)
- `src/components/templates/TemplateDetailClient.tsx` (detail client component)
- `__tests__/database/templateRepository.test.ts` (database tests)
- `__tests__/api/user/templates.test.ts` (user API tests)
- `__tests__/api/templates-extended.test.ts` (admin API extension tests)
- `__tests__/components/templates/TemplateCard.test.tsx` (card component tests)
- `__tests__/components/templates/TemplateBrowseClient.test.tsx` (browse component tests)
- `__tests__/components/templates/TemplateDetailClient.test.tsx` (detail component tests)
- `__tests__/integration/templateRepository.test.ts` (integration/gap tests)

Existing files to modify:
- `prisma/schema.prisma` (add fields to VideoTemplate and User models)
- `src/app/api/templates/route.ts` (extend GET and POST for new fields)
- `src/app/api/templates/[id]/route.ts` (extend PATCH for isPublished)
