# Spec Requirements: Template Creator UI

## Initial Description
A UI for creating and editing video templates. This builds on the existing template repository system where admins can create templates that users browse. Currently templates can only be created via API — this adds a visual admin UI for creating and editing templates with live preview of colors, fonts, timing, and layout options.

## Requirements Discussion

### First Round Questions

**Q1:** UI location and navigation — I'm assuming this will live under the existing admin panel at `/admin/templates` (with a new "Templates" nav item added to `AdminNav.tsx`), following the same layout pattern (sidebar nav + main content area with orange-600 header). Is that correct, or should it be a separate standalone page?
**Answer:** `/dashboard/templates/create` — under the existing dashboard templates section, still admin-gated. NOT in the admin panel.

**Q2:** Form structure — single page vs. multi-step wizard. The `VideoTemplate` config has 6 major sections (global colors/fonts/timing, intro, bookReveal, statsReveal, comingSoon, outro). I'm thinking a tabbed or accordion-based single-page editor where each section is a collapsible/tab panel would work well, rather than a multi-step wizard like `AddBookWizard`. This would let admins jump between sections freely while editing. Is that the right approach, or would you prefer a step-by-step wizard?
**Answer:** Tabbed sections — single-page editor with tabs/panels for each section, jump freely between them.

**Q3:** Color picker implementation — For the 16 color properties, should we use native HTML color inputs (or a lightweight color picker component) with hex value text inputs alongside them, rather than pulling in a heavy library like react-colorful?
**Answer:** Simple native HTML color input + hex text field is fine. No heavy library needed.

**Q4:** Timing controls — The template has 23 timing values in frames (at 30fps). Should admins edit individual timing values, or would it be better to expose only the "total" values per sequence and auto-calculate the sub-timings?
**Answer:** Totals only, auto-calculate — only expose per-sequence totals, auto-distribute sub-timings proportionally.

**Q5:** "Live preview" scope — The raw idea mentions "live preview of colors, fonts, timing, and layout options." Does this mean a static visual preview panel (showing color swatches, font samples, and layout diagrams) that updates as the admin edits values — NOT an actual Remotion video preview rendering in real-time?
**Answer:** Static visual preview — color swatches, font samples, layout diagrams that update live. No video rendering.

**Q6:** Template lifecycle — create, edit, and list. Does this UI need three views: (a) a list page showing all templates with status (published/draft), (b) a create form pre-populated with DEFAULT_TEMPLATE values, and (c) an edit form that loads the existing template config? Is admin-side duplication needed?
**Answer:** Yes — list, create (pre-populated with DEFAULT_TEMPLATE), and edit views. Admin duplication from admin side is not needed (users already have duplicate).

**Q7:** Publish workflow — Can the admin toggle isPublished directly via a switch/checkbox on the create/edit form, with no additional approval workflow needed?
**Answer:** Simple toggle/switch, no approval workflow needed.

**Q8:** Is there anything that should be explicitly OUT of scope?
**Answer:** Bulk operations, versioning/history, import/export, Remotion preview integration.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Admin panel UI patterns - Path: `src/components/admin/` (AdminNav, BookEditForm, Pagination, Toast, etc.)
- Feature: Existing template display components - Path: `src/components/templates/` (TemplateCard.tsx, TemplateBrowseClient.tsx, TemplateDetailClient.tsx)
- Feature: Existing template browse/detail pages - Path: `src/app/dashboard/templates/`
- Feature: Admin template CRUD API routes - Path: `src/app/api/templates/route.ts` and `src/app/api/templates/[id]/route.ts`
- Feature: Template config validation - Path: `src/lib/video/validateTemplateConfig.ts`
- Feature: VideoTemplate type definitions and defaults - Path: `services/video-gen/src/lib/template-types.ts`
- Feature: Theme defaults (colors, fonts, timing) - Path: `services/video-gen/src/lib/theme.ts`
- Feature: Modal/wizard patterns - Path: `src/components/modals/AddBookWizard.tsx`
- Components to potentially reuse: TemplateCard for list view, Toast for success/error feedback, Pagination for template list, existing admin layout patterns for form styling
- Backend logic to reference: The existing admin template API routes already support full CRUD (GET list, GET single, POST create, PATCH update, DELETE). validateTemplateConfig provides strict schema validation. The API routes use requireAdmin() guards and logAdminAction/logFieldChanges for audit trail.

### Follow-up Questions
No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements

**Template List View (at `/dashboard/templates` — enhance existing page)**
- Admin users see an "admin management" section or a "Create New Template" button on the existing template browse page
- List shows all templates (both published and draft) for admin users
- Each template entry shows: name, published/draft status, creation date, usage count
- Actions per template: Edit, Delete (with confirmation)
- The existing TemplateBrowseClient at `src/components/templates/TemplateBrowseClient.tsx` already handles the user-facing browse; admin controls layer on top or sit alongside

**Template Create View (at `/dashboard/templates/create`)**
- Admin-only access (gated by requireAdmin or equivalent client-side check)
- Form pre-populated with all DEFAULT_TEMPLATE values from `services/video-gen/src/lib/template-types.ts`
- Template metadata fields: name (required), description (optional), isPublished toggle
- Tabbed single-page editor with the following tabs:
  1. **Colors** — All 16 color properties from ColorsConfig (background, backgroundSecondary, backgroundTertiary, textPrimary, textSecondary, textMuted, accent, accentSecondary, accentMuted, completed, dnf, ratingHigh, ratingMedium, ratingLow, overlay, grain). Each with native HTML color input + hex text field.
  2. **Fonts** — 3 font properties (heading, body, mono) as text inputs
  3. **Timing** — Per-sequence total values only (introTotal, bookTotal, statsTotal, comingSoonTotal, outroTotal, transitionOverlap). Displayed as number inputs showing both frames and equivalent seconds. Sub-timings auto-calculated proportionally from totals based on the default proportions in DEFAULT_TEMPLATE.
  4. **Intro** — layout select (centered/split/minimal), titleFontSize number, subtitleFontSize number, showYear toggle
  5. **Book Reveal** — layout select (sequential/grid/carousel), showRatings toggle, showAuthors toggle, coverSize select (small/medium/large), animationStyle select (slide/fade/pop)
  6. **Stats Reveal** — layout select (stacked/horizontal/minimal), showTotalBooks toggle, showTotalPages toggle, showAverageRating toggle, showTopBook toggle, animateNumbers toggle
  7. **Coming Soon** — layout select (list/grid/single), showProgress toggle, maxBooks number input
  8. **Outro** — layout select (centered/minimal/branded), showBranding toggle, customText text input
- Static live preview panel that updates as values change, showing: color palette swatches, font family samples, selected layout labels/diagrams, timing summary
- Save button that calls `POST /api/templates` with the assembled config JSON
- Validation feedback using the existing `validateTemplateConfig` function before submission
- Success/error feedback (Toast or inline messages)

**Template Edit View (at `/dashboard/templates/[id]/edit`)**
- Same tabbed editor as create, but pre-populated with the existing template's config
- Loads template via `GET /api/templates/[id]`
- Save calls `PATCH /api/templates/[id]` with updated config
- Delete option available from edit view

**Timing Auto-Calculation Logic**
- Admin sets only the total frames per sequence (e.g., introTotal)
- Sub-timings are auto-distributed proportionally based on the ratios in DEFAULT_TEMPLATE
- Example: DEFAULT_TEMPLATE intro has fadeIn=15, hold=45, fadeOut=15, total=75. Ratios are 0.2/0.6/0.2. If admin sets introTotal=150, sub-timings become fadeIn=30, hold=90, fadeOut=30.
- transitionOverlap is a standalone value, not part of any sequence total

**Static Preview Panel**
- Color palette: Grid of color swatches with labels, updating live as colors change
- Font preview: Sample text rendered in each font family (heading, body, mono)
- Layout summary: Text labels or simple visual diagrams showing selected layout per sequence
- Timing overview: Bar or summary showing relative duration of each sequence

### Reusability Opportunities
- Existing `TemplateCard` component can be reused in the admin list view
- Existing `validateTemplateConfig` handles all validation — call it client-side before API submission
- Existing admin API routes (`/api/templates/`) provide full CRUD — no new API routes needed
- Existing `Toast` component from admin UI for success/error feedback
- The `DEFAULT_TEMPLATE` constant from `services/video-gen/src/lib/template-types.ts` provides all default values for pre-population
- The `TemplateDetailClient` component's color swatch and font display patterns can inform the preview panel design

### Scope Boundaries

**In Scope:**
- Tabbed template editor UI with all config sections (colors, fonts, timing, per-sequence layouts and options)
- Create new template form at `/dashboard/templates/create`
- Edit existing template form at `/dashboard/templates/[id]/edit`
- Admin controls on the template list/browse page (create button, edit/delete actions)
- Static live preview panel (color swatches, font samples, layout labels, timing summary)
- Timing auto-calculation (totals only exposed, sub-timings derived proportionally)
- isPublished toggle
- Client-side validation using existing validateTemplateConfig
- Admin-only access gating

**Out of Scope:**
- Bulk template operations
- Template versioning or change history
- Template import/export
- Remotion video preview integration (actual video frame rendering)
- Admin-side template duplication (users already have this via the browse UI)
- New API routes (existing CRUD routes are sufficient)
- Preview thumbnail generation/upload (previewThumbnailUrl field exists but upload UI is out of scope)

### Technical Considerations
- Pages live under `/dashboard/templates/` (not `/admin/`), using the dashboard layout rather than the admin panel layout
- Access control: Admin gating at the page level via `requireAdmin()` server-side check, similar to admin layout pattern but applied within the dashboard context
- The `VideoTemplate` type and `DEFAULT_TEMPLATE` live in `services/video-gen/src/lib/template-types.ts` — the main Next.js app will need to either import these types or duplicate the type definitions for the form. Since video-gen is a separate service with its own package.json, the types may need to be duplicated or shared via a common types file in the main app (e.g., `src/types/video-template.ts`).
- The existing validation utility is at `src/lib/video/validateTemplateConfig.ts` in the main app and can be used directly client-side
- Form state management: React useState or useReducer for the nested config object, with tab-based UI sections
- Color inputs: Native `<input type="color">` paired with text `<input>` for hex values
- Timing display: Show frame count with computed seconds label (frames / 30 = seconds)
- The form must assemble the full VideoTemplate JSON config including only the fields that differ from defaults, or send the complete config — the API and validation support both approaches
- Existing API routes handle audit logging automatically (logAdminAction, logFieldChanges)
