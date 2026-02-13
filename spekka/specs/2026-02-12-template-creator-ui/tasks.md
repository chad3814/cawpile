# Task Breakdown: Template Creator UI

## Overview
Total Tasks: 35

This feature adds an admin-only visual interface for creating and editing video templates, with a tabbed editor covering all config sections (Colors, Fonts, Timing, Intro, Book Reveal, Stats Reveal, Coming Soon, Outro) and a static live preview panel. It reuses existing CRUD API routes and extends the existing template browse page with admin controls.

## Task List

### Type Definitions & Utilities

#### Task Group 1: VideoTemplate Type Sharing and Timing Utilities
**Dependencies:** None

- [x] 1.0 Complete type definitions and utility layer
  - [x] 1.1 Write 4 focused tests for timing auto-calculation logic
    - Test proportional sub-timing distribution from a sequence total (e.g., introTotal=150 produces fadeIn=30, hold=90, fadeOut=30)
    - Test rounding correction ensures sub-timings sum exactly to the total
    - Test all five sequence types distribute correctly (intro, book, stats, comingSoon, outro)
    - Test transitionOverlap passes through unchanged (not derived from any total)
  - [x] 1.2 Create `src/types/video-template.ts` with duplicated type definitions
    - Duplicate `VideoTemplate`, `ColorsConfig`, `FontsConfig`, `TimingConfig`, `IntroConfig`, `BookRevealConfig`, `StatsRevealConfig`, `ComingSoonConfig`, `OutroConfig` interfaces from `services/video-gen/src/lib/template-types.ts`
    - Duplicate layout type unions: `IntroLayout`, `BookRevealLayout`, `StatsRevealLayout`, `ComingSoonLayout`, `OutroLayout`
    - Duplicate `ResolvedVideoTemplate` and all `Resolved*Config` types
    - Create `DEFAULT_TEMPLATE` constant with hardcoded values from `services/video-gen/src/lib/theme.ts` (not importing from video-gen)
    - Add a comment in both files referencing the other as the canonical copy to keep in sync
  - [x] 1.3 Create timing auto-calculation utility in `src/lib/video/timingCalculation.ts`
    - Compute default ratios from `DEFAULT_TEMPLATE` for each sequence (e.g., intro: fadeIn/total, hold/total, fadeOut/total)
    - Store ratios as constants derived once from the default values
    - Implement `calculateSubTimings(sequenceKey, newTotal)` that distributes a total proportionally by default ratios
    - Round sub-timings to nearest integer; adjust the largest sub-timing if rounding causes sum drift
    - Implement `assembleFullTimingConfig(totals)` that takes the 6 admin-editable values (5 sequence totals + transitionOverlap) and returns a complete `TimingConfig` with all 23 timing properties
  - [x] 1.4 Ensure timing utility tests pass
    - Run ONLY the 4 tests written in 1.1
    - Verify ratio calculations and rounding behavior

**Acceptance Criteria:**
- The 4 tests written in 1.1 pass
- `src/types/video-template.ts` exports all necessary types and `DEFAULT_TEMPLATE`
- `calculateSubTimings` correctly distributes any total proportionally and handles rounding
- `assembleFullTimingConfig` produces a valid complete `TimingConfig` from 6 inputs
- Cross-reference comments exist in both the main app and video-gen type files

### Template Browse Page Enhancement

#### Task Group 2: Admin Controls on Template Browse Page
**Dependencies:** Task Group 1

- [x] 2.0 Complete admin controls on the browse page
  - [x] 2.1 Write 4 focused tests for browse page admin behavior
    - Test that `TemplateBrowseClient` renders "Create New Template" button when `isAdmin` is true
    - Test that "Create New Template" button is not rendered when `isAdmin` is false or absent
    - Test that admin users see Edit and Delete action buttons on each template card
    - Test that Delete button triggers a confirmation dialog before proceeding
  - [x] 2.2 Update `src/app/dashboard/templates/page.tsx` server component
    - Import `getCurrentUser` from `@/lib/auth-helpers`
    - Determine `isAdmin` status from the user object
    - Pass `isAdmin` boolean prop to `TemplateBrowseClient`
  - [x] 2.3 Extend `TemplateBrowseClient` to accept and use `isAdmin` prop
    - Add `isAdmin?: boolean` to the component props interface
    - When `isAdmin` is true, render a "Create New Template" button linking to `/dashboard/templates/create` in the header area
    - When `isAdmin` is true, fetch all templates (published and draft) from `/api/templates` instead of `/api/user/templates` and show a status badge (Published/Draft) on each card
    - Add admin fetch logic alongside existing user fetch logic
  - [x] 2.4 Extend `TemplateCard` to support admin mode
    - Add optional `isAdmin`, `isPublished`, `onEdit`, and `onDelete` props to `TemplateCardProps`
    - When `isAdmin` is true, render a Published/Draft status badge on the card
    - When `isAdmin` is true, render Edit (link to `/dashboard/templates/[id]/edit`) and Delete action buttons
    - Delete button opens a confirmation dialog; on confirm, calls `DELETE /api/templates/[id]`
    - Add `TemplateCardData` fields for `isPublished` (optional, for admin cards)
  - [x] 2.5 Ensure browse page admin tests pass
    - Run ONLY the 4 tests written in 2.1
    - Verify admin-only UI elements render conditionally

**Acceptance Criteria:**
- The 4 tests written in 2.1 pass
- Admin users see "Create New Template" button, status badges, and Edit/Delete actions
- Non-admin users see no admin controls (existing behavior preserved)
- Delete confirmation dialog prevents accidental deletion
- Admin browse fetches all templates including drafts

### Template Editor Core

#### Task Group 3: TemplateEditorClient Component and Tab Infrastructure
**Dependencies:** Task Groups 1, 2

- [x] 3.0 Complete the core tabbed editor component
  - [x] 3.1 Write 6 focused tests for the editor component
    - Test that the editor renders all 8 tab buttons (Colors, Fonts, Timing, Intro, Book Reveal, Stats Reveal, Coming Soon, Outro)
    - Test that clicking a tab switches the visible panel content
    - Test that "create" mode pre-populates all fields with `DEFAULT_TEMPLATE` values
    - Test that "edit" mode pre-populates fields from a provided initial config
    - Test that the save button calls `validateTemplateConfig` before submission
    - Test that validation errors display inline and switch to the tab containing the first error
  - [x] 3.2 Create `TemplateEditorClient` component at `src/components/templates/TemplateEditorClient.tsx`
    - `"use client"` component accepting props: `mode: "create" | "edit"`, `initialConfig?: VideoTemplate`, `templateId?: string`, `initialName?: string`, `initialDescription?: string`, `initialIsPublished?: boolean`
    - Use `useReducer` to manage the nested config object as form state (with actions for each config section)
    - Render metadata fields at the top: name (required text input), description (optional textarea), isPublished toggle switch
    - Render 8 horizontal tab buttons with active tab highlighting
    - Render the active tab's panel content below the tabs
    - Two-column layout: editor (left) and preview panel (right) on large screens; stacked on mobile
  - [x] 3.3 Implement Colors tab panel
    - Render all 16 color fields matching `ColorsConfig` keys
    - Each field: native `<input type="color">` alongside a text `<input>` for hex value, synced bidirectionally
    - Group visually by category with section headings: Backgrounds (3), Text (3), Accents (3), Status (2), Rating (3), Effects (2)
    - Reuse `formatColorLabel` from `TemplateDetailClient` for human-readable labels
  - [x] 3.4 Implement Fonts tab panel
    - Render 3 text inputs for heading, body, and mono font family strings
    - Labels and placeholder text indicating expected format (e.g., "Inter, system-ui, sans-serif")
  - [x] 3.5 Implement Timing tab panel
    - Render 6 number inputs: introTotal, bookTotal, statsTotal, comingSoonTotal, outroTotal, transitionOverlap
    - Each input shows both the frame count and a computed seconds label (frames / 30)
    - Below each sequence total, display the auto-calculated read-only sub-timings using `calculateSubTimings` from Task 1.3
    - transitionOverlap is a standalone editable field with no sub-timings
  - [x] 3.6 Implement Intro tab panel
    - Layout select with options: centered, split, minimal
    - titleFontSize number input
    - subtitleFontSize number input
    - showYear toggle switch
  - [x] 3.7 Implement Book Reveal tab panel
    - Layout select: sequential, grid, carousel
    - showRatings toggle, showAuthors toggle
    - coverSize select: small, medium, large
    - animationStyle select: slide, fade, pop
  - [x] 3.8 Implement Stats Reveal tab panel
    - Layout select: stacked, horizontal, minimal
    - showTotalBooks toggle, showTotalPages toggle, showAverageRating toggle, showTopBook toggle
    - animateNumbers toggle
  - [x] 3.9 Implement Coming Soon tab panel
    - Layout select: list, grid, single
    - showProgress toggle
    - maxBooks number input
  - [x] 3.10 Implement Outro tab panel
    - Layout select: centered, minimal, branded
    - showBranding toggle
    - customText text input
  - [x] 3.11 Implement save flow
    - "Save Template" button in a sticky footer
    - On click: assemble the full `VideoTemplate` config object from reducer state, including computed sub-timings via `assembleFullTimingConfig`
    - Run `validateTemplateConfig()` client-side before API submission
    - If validation fails: display errors inline near relevant fields and auto-switch to the tab containing the first error
    - If validation passes: call `POST /api/templates` (create mode) or `PATCH /api/templates/[id]` (edit mode) with `{ name, description, config, isPublished }`
    - Show loading spinner on save button during API call
    - On success: redirect to `/dashboard/templates`
    - On API error: display error message inline without losing form state
  - [x] 3.12 Ensure editor component tests pass
    - Run ONLY the 6 tests written in 3.1
    - Verify tab switching, pre-population, and save flow

**Acceptance Criteria:**
- The 6 tests written in 3.1 pass
- All 8 tabs render correct form fields matching the spec
- Config state management via useReducer handles all nested updates
- Colors sync between color picker and hex text input
- Timing tab shows computed seconds and read-only sub-timings
- Save flow validates, submits to correct API endpoint, and handles success/error

### Static Live Preview Panel

#### Task Group 4: Preview Panel Component
**Dependencies:** Task Group 3

- [x] 4.0 Complete the static live preview panel
  - [x] 4.1 Write 4 focused tests for the preview panel
    - Test that color swatches update reactively when color config values change
    - Test that font preview samples render with the correct `font-family` style attribute
    - Test that layout summary displays the currently selected layout for each sequence as labeled badges
    - Test that timing overview displays proportional durations with frame and seconds labels
  - [x] 4.2 Create `TemplatePreviewPanel` component at `src/components/templates/TemplatePreviewPanel.tsx`
    - `"use client"` component accepting the current config state as props (reactive to changes)
    - Render in the right column of the two-column editor layout
    - Sections: Color Palette, Font Preview, Layout Summary, Timing Overview
  - [x] 4.3 Implement color palette preview
    - Grid of circular color swatches with labels, updating reactively as color inputs change
    - Reuse the swatch rendering pattern from `TemplateDetailClient` (circular divs with `backgroundColor` style)
    - Group by category matching the Colors tab groupings
    - Use `formatColorLabel` for human-readable labels
  - [x] 4.4 Implement font preview section
    - Three sample text lines: "Heading Sample" rendered with heading font, "Body text sample" with body font, "mono sample" with mono font
    - Each line uses inline `style={{ fontFamily: currentFontValue }}` to demonstrate the font
  - [x] 4.5 Implement layout summary section
    - For each of the 5 sequences (Intro, Book Reveal, Stats Reveal, Coming Soon, Outro), display the currently selected layout option as a labeled badge
    - Reuse `SEQUENCE_SECTIONS` constant from `TemplateDetailClient`
  - [x] 4.6 Implement timing overview section
    - Horizontal stacked bar showing relative proportional duration of each sequence
    - Labels on each segment showing sequence name, frame count, and seconds (frames / 30)
    - transitionOverlap displayed as a separate annotation
  - [x] 4.7 Ensure preview panel tests pass
    - Run ONLY the 4 tests written in 4.1
    - Verify reactive updates across all preview sections

**Acceptance Criteria:**
- The 4 tests written in 4.1 pass
- Color swatches update in real-time as color inputs change
- Font samples display with correct font-family applied
- Layout badges reflect current selections across all sequences
- Timing bar shows proportional durations with correct labels

### Create and Edit Pages

#### Task Group 5: Server Pages for Create and Edit
**Dependencies:** Task Groups 3, 4

- [x] 5.0 Complete create and edit page routes
  - [x] 5.1 Write 4 focused tests for page-level behavior
    - Test that `/dashboard/templates/create` page is admin-gated (non-admins are redirected)
    - Test that `/dashboard/templates/[id]/edit` page is admin-gated
    - Test that the edit page fetches and passes the existing template config to the editor
    - Test that the edit page includes a Delete button that calls `DELETE /api/templates/[id]` with confirmation and redirects
  - [x] 5.2 Create `src/app/dashboard/templates/create/page.tsx` server component
    - Call `requireAdmin()` from `@/lib/auth/admin` to gate access (redirects non-admins to `/`)
    - Render `TemplateEditorClient` in "create" mode with no initial config (uses DEFAULT_TEMPLATE defaults)
  - [x] 5.3 Create `src/app/dashboard/templates/[id]/edit/page.tsx` server component
    - Call `requireAdmin()` to gate access
    - Fetch the existing template via direct Prisma query (`prisma.videoTemplate.findUnique`)
    - If template not found, redirect to `/dashboard/templates`
    - Pass the template's config, name, description, and isPublished to `TemplateEditorClient` in "edit" mode with `templateId`
  - [x] 5.4 Add Delete functionality to the edit page
    - Include a Delete button within the editor or page that opens a confirmation dialog
    - On confirm, call `DELETE /api/templates/[id]`
    - On success, redirect to `/dashboard/templates`
    - On error, display error message inline
  - [x] 5.5 Ensure page-level tests pass
    - Run ONLY the 4 tests written in 5.1
    - Verify admin gating, data loading, and delete flow

**Acceptance Criteria:**
- The 4 tests written in 5.1 pass
- Create page is accessible only to admins
- Edit page is accessible only to admins and loads existing template data
- Delete from edit page works with confirmation and redirect
- Both pages render the `TemplateEditorClient` with correct mode and initial data

### Testing

#### Task Group 6: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-5

- [x] 6.0 Review existing tests and fill critical gaps only
  - [x] 6.1 Review tests from Task Groups 1-5
    - Review the 4 tests from Task Group 1 (timing utilities)
    - Review the 4 tests from Task Group 2 (browse page admin controls)
    - Review the 6 tests from Task Group 3 (editor component)
    - Review the 4 tests from Task Group 4 (preview panel)
    - Review the 4 tests from Task Group 5 (create/edit pages)
    - Total existing tests: 22
  - [x] 6.2 Analyze test coverage gaps for this feature only
    - Identify critical user workflows that lack test coverage
    - Focus ONLY on gaps related to the template creator UI feature
    - Prioritize end-to-end workflows: create template flow, edit template flow, delete template flow
    - Do NOT assess entire application test coverage
  - [x] 6.3 Write up to 10 additional strategic tests maximum
    - Potential gap areas to address:
      - Full create flow: fill form, save, verify API call payload includes correct nested config structure
      - Full edit flow: load existing template, modify values, save, verify PATCH payload
      - Timing auto-calculation integration: changing a total in the editor updates the preview panel timing bar
      - Color input bidirectional sync: changing hex text input updates the color picker and vice versa
      - Validation error tab switching: validation error on a non-active tab auto-switches to that tab
      - Config assembly: verify the reducer state correctly assembles into a valid `VideoTemplate` JSON object
    - Do NOT write comprehensive coverage for all scenarios
    - Skip edge cases, performance tests, and accessibility tests unless business-critical
  - [x] 6.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature (tests from 1.1, 2.1, 3.1, 4.1, 5.1, and 6.3)
    - Expected total: approximately 22-32 tests maximum
    - Do NOT run the entire application test suite
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 22-32 tests total)
- Critical user workflows (create, edit, delete) are covered end-to-end
- No more than 10 additional tests added when filling in testing gaps
- Testing focused exclusively on the template creator UI feature requirements

## Execution Order

Recommended implementation sequence:

1. **Type Definitions and Utilities (Task Group 1)** - Foundation layer establishing shared types and timing calculation logic. No dependencies, required by all subsequent groups.
2. **Browse Page Admin Controls (Task Group 2)** - Extends existing browse page with admin UI. Depends on types from Group 1. Can be developed in parallel with Group 3 after Group 1 completes.
3. **Editor Core (Task Group 3)** - The main editor component with all 8 tab panels and save flow. Depends on types and timing utilities from Group 1. This is the largest task group.
4. **Preview Panel (Task Group 4)** - Static live preview that reads from editor state. Depends on Group 3 for the editor state structure and layout.
5. **Create and Edit Pages (Task Group 5)** - Server components that wire the editor into the routing system. Depends on Groups 3 and 4 being complete.
6. **Test Review and Gap Analysis (Task Group 6)** - Final review of all tests, filling critical gaps. Depends on all other groups being complete.

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/types/video-template.ts` | New. Duplicated types and DEFAULT_TEMPLATE from video-gen |
| `src/lib/video/timingCalculation.ts` | New. Timing auto-calculation utility |
| `src/components/templates/TemplateEditorClient.tsx` | New. Main tabbed editor client component |
| `src/components/templates/TemplatePreviewPanel.tsx` | New. Static live preview panel |
| `src/app/dashboard/templates/create/page.tsx` | New. Admin-gated create page |
| `src/app/dashboard/templates/[id]/edit/page.tsx` | New. Admin-gated edit page |
| `src/app/dashboard/templates/page.tsx` | Modified. Pass isAdmin prop to browse client |
| `src/components/templates/TemplateBrowseClient.tsx` | Modified. Accept isAdmin, show admin controls |
| `src/components/templates/TemplateCard.tsx` | Modified. Support admin mode with status badge, edit/delete |
| `src/lib/video/validateTemplateConfig.ts` | Existing. Used client-side for pre-submission validation |
| `src/lib/auth/admin.ts` | Existing. `requireAdmin()` used in create/edit pages |
| `src/app/api/templates/route.ts` | Existing. GET (list) and POST (create) endpoints |
| `src/app/api/templates/[id]/route.ts` | Existing. GET, PATCH, DELETE endpoints |
| `services/video-gen/src/lib/template-types.ts` | Existing. Source of truth for types (add sync comment) |
