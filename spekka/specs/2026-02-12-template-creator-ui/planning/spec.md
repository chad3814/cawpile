# Specification: Template Creator UI

## Goal
Provide an admin-only visual interface for creating and editing video templates, with a tabbed editor for all config sections and a static live preview panel, reusing the existing template CRUD API routes.

## User Stories
- As an admin, I want to create and edit video templates through a visual form so that I can design templates without manually writing JSON config
- As an admin, I want to see a live preview of color swatches, font samples, and layout choices as I edit so that I can understand the impact of my changes before saving

## Specific Requirements

**Template List View Enhancement**
- Extend the existing `/dashboard/templates` browse page to detect admin users via `getCurrentUser()` and conditionally render admin controls
- Add a "Create New Template" button visible only to admins, linking to `/dashboard/templates/create`
- Admin users see all templates (published and draft) with a status badge on each card; non-admins continue to see only published templates
- Each template card for admins shows Edit and Delete action buttons; Delete requires a confirmation dialog before calling `DELETE /api/templates/[id]`
- The existing `TemplateBrowseClient` component should receive an `isAdmin` boolean prop from the server component, which passes the admin status determined via `getCurrentUser()`

**Create Page**
- New server component at `/dashboard/templates/create/page.tsx` that calls `requireAdmin()` to gate access, redirecting non-admins to `/`
- Renders a client component `TemplateEditorClient` in "create" mode, pre-populated with all `DEFAULT_TEMPLATE` values
- Template metadata fields at the top: name (required text input), description (optional textarea), isPublished toggle switch
- On save, assembles the full `VideoTemplate` JSON config object, runs `validateTemplateConfig()` client-side, then calls `POST /api/templates` with `{ name, description, config, isPublished }`
- On success, redirect to `/dashboard/templates`; on error, display validation errors inline

**Edit Page**
- New server component at `/dashboard/templates/[id]/edit/page.tsx` that calls `requireAdmin()` to gate access
- Fetches the existing template via `GET /api/templates/[id]` server-side (or direct Prisma query) and passes the config to `TemplateEditorClient` in "edit" mode
- On save, calls `PATCH /api/templates/[id]` with updated fields
- Includes a Delete button that calls `DELETE /api/templates/[id]` with confirmation, then redirects to `/dashboard/templates`

**Tabbed Editor Component**
- A single `TemplateEditorClient` client component (`"use client"`) used by both create and edit pages, accepting an optional initial config and a mode prop (`"create" | "edit"`)
- Uses `useState` or `useReducer` to manage the nested config object as form state
- 8 tabs rendered as horizontal tab buttons: Colors, Fonts, Timing, Intro, Book Reveal, Stats Reveal, Coming Soon, Outro
- **Colors tab**: 16 color fields matching `ColorsConfig` keys, each rendered as a native `<input type="color">` alongside a text `<input>` for hex values; grouped visually by category (Backgrounds, Text, Accents, Status, Rating, Effects)
- **Fonts tab**: 3 text inputs for heading, body, mono font family strings
- **Timing tab**: 6 number inputs for sequence totals (introTotal, bookTotal, statsTotal, comingSoonTotal, outroTotal, transitionOverlap); each shows both frame count and computed seconds label (frames / 30); sub-timings are read-only and shown below each total for transparency
- **Intro tab**: layout select (centered/split/minimal), titleFontSize number, subtitleFontSize number, showYear toggle
- **Book Reveal tab**: layout select (sequential/grid/carousel), showRatings toggle, showAuthors toggle, coverSize select (small/medium/large), animationStyle select (slide/fade/pop)
- **Stats Reveal tab**: layout select (stacked/horizontal/minimal), showTotalBooks toggle, showTotalPages toggle, showAverageRating toggle, showTopBook toggle, animateNumbers toggle
- **Coming Soon tab**: layout select (list/grid/single), showProgress toggle, maxBooks number input
- **Outro tab**: layout select (centered/minimal/branded), showBranding toggle, customText text input

**Static Live Preview Panel**
- Rendered alongside the tabbed editor in a two-column layout (editor left, preview right on large screens; stacked on mobile)
- **Color palette**: Grid of circular color swatches with labels, updating reactively as color inputs change; reuse the swatch rendering pattern from `TemplateDetailClient`
- **Font preview**: Sample text lines ("Heading Sample", "Body text sample", "mono sample") each rendered with `font-family` set to the current font value
- **Layout summary**: For each sequence, display the currently selected layout option as a labeled badge
- **Timing overview**: Horizontal stacked bar or simple summary showing the relative proportional duration of each sequence, with labels showing frames and seconds

**Timing Auto-Calculation**
- When admin changes a sequence total (e.g., introTotal), auto-calculate sub-timings by preserving the ratios from `DEFAULT_TEMPLATE`
- Example: DEFAULT intro ratios are fadeIn=15/75=0.2, hold=45/75=0.6, fadeOut=15/75=0.2; if admin sets introTotal=150, computed values are fadeIn=30, hold=90, fadeOut=30
- Round sub-timings to nearest integer; ensure they sum exactly to the total by adjusting the largest sub-timing if rounding causes drift
- transitionOverlap is edited directly as a standalone value, not derived from any total
- Store the pre-computed default ratios as constants in the editor component, derived once from `DEFAULT_TEMPLATE` values

**Publish Toggle**
- Simple on/off switch rendered in the metadata section of the editor (above the tabs)
- Maps directly to the `isPublished` boolean field sent to the API
- Unpublished templates (drafts) are visible only to admin users in the browse list

**Save Flow**
- "Save Template" button at the bottom of the editor (or in a sticky footer)
- On click: assemble the full `VideoTemplate` config object from form state, run `validateTemplateConfig()` client-side
- If validation fails, display errors inline near the relevant fields and switch to the tab containing the first error
- If validation passes, call `POST /api/templates` (create) or `PATCH /api/templates/[id]` (edit)
- Show loading state on the save button during the API call
- On success, show a brief success toast/message and redirect to `/dashboard/templates`
- On API error, display the error message inline without losing form state

**VideoTemplate Type Sharing**
- Duplicate the `VideoTemplate`, `ColorsConfig`, `FontsConfig`, `TimingConfig`, and sequence config interfaces from `services/video-gen/src/lib/template-types.ts` into a new file `src/types/video-template.ts` in the main Next.js app
- Also duplicate `DEFAULT_TEMPLATE` as a constant (with hardcoded values from `theme.ts` rather than importing from video-gen)
- This avoids cross-service imports while keeping the types in sync; a comment in both files should reference the other as the source of truth

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**`src/components/templates/TemplateBrowseClient.tsx` and `TemplateCard.tsx`**
- Already renders the template gallery grid with search, sort, and pagination
- Extend with an `isAdmin` prop to conditionally show admin controls (create button, edit/delete actions per card)
- `TemplateCard` color swatch rendering pattern should be reused in the preview panel

**`src/components/templates/TemplateDetailClient.tsx`**
- Contains color swatch grid, font display cards, and layout label rendering
- These display patterns should inform the static preview panel design in the editor
- The `formatColorLabel` utility and `SEQUENCE_SECTIONS` constant can be reused directly

**`src/app/api/templates/route.ts` and `src/app/api/templates/[id]/route.ts`**
- Full CRUD API already exists with admin gating, config validation, and audit logging
- No new API routes needed; the editor calls these existing endpoints directly
- POST accepts `{ name, description, config, isPublished }`, PATCH accepts partial updates

**`src/lib/video/validateTemplateConfig.ts`**
- Strict schema validation that rejects unknown properties and invalid values
- Call client-side before API submission to provide immediate feedback
- Validation error paths (e.g., `global.colors.accent`) can be mapped to the appropriate tab for inline error display

**`src/lib/auth/admin.ts` — `requireAdmin()`**
- Server-side admin gating that redirects non-admins to `/`
- Use in the create and edit page server components for access control
- `getCurrentUser()` from `src/lib/auth-helpers.ts` provides `isAdmin` for the browse page conditional rendering

## Out of Scope
- Bulk template operations (bulk delete, bulk publish)
- Template versioning or change history tracking
- Template import/export (JSON file upload/download)
- Remotion video preview integration (no actual video frame rendering in the editor)
- Admin-side template duplication (users already have duplicate functionality via the browse UI)
- New API routes (existing admin CRUD routes are sufficient)
- Preview thumbnail generation or upload UI (the `previewThumbnailUrl` field exists but upload is not part of this spec)
- Undo/redo functionality in the editor
- Drag-and-drop reordering of sequences
- Template sharing or collaboration features
