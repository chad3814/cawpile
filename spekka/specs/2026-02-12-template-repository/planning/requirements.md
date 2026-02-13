# Spec Requirements: Template Repository

## Initial Description

Build a template repository/browsing system on the website (Next.js app) side. Templates are stored in the database and have a user associated as the creator. The UI allows browsing templates. No video rendering is needed at this point -- just the data model, API, and browsing UI.

This spec was initiated as part of the monthly recap template system development, which is the current top priority on the product roadmap (items 1-4).

## Requirements Discussion

### First Round Questions

**Q1:** The existing `VideoTemplate` model and API routes are admin-only (all endpoints require `isAdmin`). I assume the "user associated as the creator" means we need to expand this so that any authenticated user can create and browse templates, not just admins. Is that correct, or should template creation remain admin-only while browsing is open to all authenticated users?

**Answer:** Admin-only creation. Only admins create templates, all authenticated users can browse.

**Q2:** I assume templates should have a visibility/status concept. For example: a template creator can save a private template, and optionally publish it to the public repository where all users can browse it. Admins could moderate published templates. Is that the right model, or should all templates be public by default?

**Answer:** Public + private. Admins can keep templates private (drafts) or publish them publicly for all users to browse.

**Q3:** I'm thinking the browsing UI would be a new user-facing page (e.g., `/templates` or `/dashboard/templates`) with a card-based grid layout showing template name, description, a preview thumbnail, and the creator's name. Users could filter/sort by newest, name, or popularity. Is that aligned with your vision, or do you see this as part of the admin panel?

**Answer:** Card grid with thumbnail, name, creator, and color swatches.

**Q4:** Since no video rendering is needed, I assume the "preview" for a browsing template would be a static thumbnail image (the existing `previewThumbnailUrl` field) and/or a visual summary of the template's color palette, fonts, and layout choices. Is a static thumbnail sufficient, or do you want a more detailed config preview (showing color swatches, layout diagrams, etc.)?

**Answer:** (Addressed in Q3 answer) Card grid includes thumbnail, name, creator, and color swatches extracted from the template config.

**Q5:** When a user finds a template they like, what should they be able to do? I assume at minimum they can "select" or "save/favorite" a template for later use when generating their recap video. Should they also be able to "duplicate and customize" (fork) someone else's template? Or is selection enough for this phase?

**Answer:** Select + duplicate. Users can select a template for use on their next recap render, and also fork/duplicate a template to customize their own version. But since creation is admin-only, duplication would create a personal copy that isn't published to the repository -- it's just for their own use.

**Q6:** The existing `VideoTemplate` model has no `userId` (creator) field. I assume we need to add a `userId` relation to the `User` model, and potentially fields like `isPublished` (Boolean), `usageCount` (Int for popularity), and a `slug` or similar for URL-friendly identification. Is there anything else you want tracked per template (tags, categories, etc.)?

**Answer:** No tags or categories needed for this phase.

**Q7:** There may already be `VideoTemplate` records in the database that have no `userId`. I assume these would either be assigned to an admin user or treated as "system templates." How should we handle existing records?

**Answer:** Existing template records without a userId should be treated as system/admin templates.

**Q8:** Is there anything you want explicitly excluded from this spec?

**Answer:** Template editing UI is NOT in scope for this spec -- just browsing and selection. No rating/reviewing/comments on templates.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Admin Books Page - Path: `src/app/admin/books/page.tsx` -- client-side data fetching, search, filters, pagination pattern
- Feature: Admin Nav - Path: `src/components/admin/AdminNav.tsx` -- navigation with conditional items
- Feature: Dashboard Client - Path: `src/components/dashboard/DashboardClient.tsx` -- grid layout pattern for user-facing content
- Feature: Existing Template API Routes - Path: `src/app/api/templates/route.ts` and `src/app/api/templates/[id]/route.ts` -- existing CRUD with admin auth, config validation, audit logging
- Feature: Template Config Validator - Path: `src/lib/video/validateTemplateConfig.ts` -- validation logic to reuse for template config
- Feature: Admin Auth Helpers - Path: `src/lib/auth/admin.ts` -- `requireAdmin()`, `getCurrentUser()` patterns
- Feature: User Auth Helpers - Path: `src/lib/auth-helpers.ts` -- `getCurrentUser()` for user-facing pages
- Feature: SharedReview Model - Path: `prisma/schema.prisma` (SharedReview) -- example of user-owned content with public access patterns
- Feature: Pagination Component - Path: `src/components/admin/Pagination.tsx` -- reusable pagination component
- Feature: VideoTemplate Type Definitions - Path: `services/video-gen/src/lib/template-types.ts` -- `VideoTemplate`, `ColorsConfig`, `FontsConfig`, layout types, and `DEFAULT_TEMPLATE`

### Follow-up Questions

No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements

**Database Schema Changes:**
- Add `userId` (String, optional/nullable) to the `VideoTemplate` model, with a relation to the `User` model. Nullable to support existing "system" templates that have no creator.
- Add `isPublished` (Boolean, default false) to control visibility. Only published templates appear in the public browse view.
- Add `usageCount` (Int, default 0) to track how many times a template has been selected/used, enabling popularity sorting.
- Add a `userTemplates` relation on the `User` model pointing back to `VideoTemplate`.
- Existing `VideoTemplate` records (those without a `userId`) remain valid as system templates with `userId = null`.
- A database migration must be created for these schema changes.

**API Routes -- Admin (extend existing):**
- `GET /api/templates` -- Extend to support an `isPublished` filter parameter. Continue requiring admin auth. Return all templates (published and unpublished) for admins.
- `POST /api/templates` -- Extend to accept `isPublished` field. Auto-set `userId` to the creating admin's ID. Continue requiring admin auth and config validation.
- `PATCH /api/templates/[id]` -- Extend to support updating `isPublished`. Continue requiring admin auth.
- `DELETE /api/templates/[id]` -- No changes needed, continues to require admin auth.

**API Routes -- User-facing (new):**
- `GET /api/user/templates` -- Returns all published templates for any authenticated user. Supports pagination (`limit`, `offset`), sorting (by `name`, `createdAt`, `usageCount`), and search by name. Includes the creator's display name and profile image. No admin auth required, only authenticated user.
- `GET /api/user/templates/[id]` -- Returns a single published template's full details for any authenticated user. Returns 404 if template is not published or does not exist.
- `POST /api/user/templates/[id]/select` -- Marks the given template as the user's selected template for their next recap render. Increments the template's `usageCount`. (This implies a field on the `User` model or a separate selection record to track which template a user has selected -- e.g., `selectedTemplateId` on the `User` model.)
- `POST /api/user/templates/[id]/duplicate` -- Creates a personal (unpublished) copy of the template for the authenticated user. The copy gets a new ID, the user's `userId`, `isPublished = false`, and a name like "Copy of [original name]". This personal copy is not visible in the public repository.

**User-Facing Browse Page:**
- New page at a user-accessible route (e.g., `/dashboard/templates` or `/templates`) for browsing published templates.
- Card-based grid layout displaying:
  - Preview thumbnail image (from `previewThumbnailUrl`)
  - Template name
  - Creator name (from the related User, or "System" for templates with no creator)
  - Color swatches extracted from the template's `config.global.colors` (showing primary colors like background, accent, text)
- Sorting options: newest, name (alphabetical), most popular (by `usageCount`)
- Search by template name
- Pagination for large template collections
- Each card links to a detail view or has action buttons for "Select" and "Duplicate"

**Template Detail View:**
- Shows full template information: name, description, creator, preview thumbnail, color palette, font choices, and layout configuration summaries for each sequence (intro, book reveal, stats, coming soon, outro)
- "Select for My Recap" button -- sets this as the user's active template
- "Duplicate" button -- creates a personal copy
- Back navigation to the browse grid

**Template Selection Tracking:**
- A mechanism to store which template a user has selected for their next recap render. This could be a `selectedTemplateId` field on the `User` model (nullable String, relation to `VideoTemplate`), or a separate join table. The simpler `selectedTemplateId` on `User` is preferred.
- When a user selects a template, the previous selection is replaced.
- The selected template ID is available to the recap rendering flow (for future specs to consume).

**Personal Template Copies:**
- When a user duplicates a template, a new `VideoTemplate` record is created with:
  - `userId` = the duplicating user's ID
  - `isPublished` = false (personal copies are never in the public repository)
  - `name` = "Copy of [original name]"
  - `config` = deep copy of the original template's config JSON
  - `description` = copied from original
  - `previewThumbnailUrl` = copied from original (or null)
- Personal copies are accessible only to the user who created them (for future template editing/customization specs).
- Personal copies should appear in a "My Templates" section or similar, separate from the public repository browse view.

### Reusability Opportunities
- The existing `src/app/api/templates/route.ts` and `src/app/api/templates/[id]/route.ts` admin routes can be extended in place for the new schema fields.
- The `validateTemplateConfig` utility at `src/lib/video/validateTemplateConfig.ts` should be reused when duplicating templates (to validate the copied config).
- The `Pagination` component at `src/components/admin/Pagination.tsx` can potentially be reused or adapted for the user-facing browse page.
- The card grid layout should follow patterns similar to the existing dashboard grid view in `src/components/dashboard/DashboardClient.tsx`.
- The `getCurrentUser()` from `src/lib/auth-helpers.ts` should be used for user-facing page authentication.
- The `requireAdmin()` from `src/lib/auth/admin.ts` should continue to be used for admin-only API routes.
- The `logAdminAction` and `logFieldChanges` from `src/lib/audit/logger.ts` should continue to be used for admin template operations.
- Color swatch rendering can parse the `ColorsConfig` interface defined in `services/video-gen/src/lib/template-types.ts` to know which color keys to display.

### Scope Boundaries

**In Scope:**
- Database schema migration: add `userId`, `isPublished`, `usageCount` to `VideoTemplate`; add `selectedTemplateId` to `User`
- Extend existing admin API routes to support new fields
- New user-facing API routes for browsing, selecting, and duplicating templates
- User-facing template browse page with card grid, search, sort, pagination
- Template detail view with select and duplicate actions
- Template selection tracking (user's chosen template for recap)
- Personal template copies via duplication
- Handling of existing templates as system templates (null userId)

**Out of Scope:**
- Template editing UI (no form for creating or modifying template config -- that is a separate future spec)
- Video rendering or preview generation
- Template rating, reviewing, or commenting
- Template tags or categories
- Template sharing between non-admin users
- Template import/export
- Social features around templates
- Admin UI changes for the new fields (the existing admin API routes are extended, but no new admin UI pages are in scope)

### Technical Considerations
- The `VideoTemplate` Prisma model needs a migration adding nullable `userId` (to preserve existing records), `isPublished` (Boolean, default false), and `usageCount` (Int, default 0). The `User` model needs a `selectedTemplateId` (nullable String) and corresponding relations.
- The existing `VideoTemplate` records in production have no `userId`. The migration must handle this gracefully -- `userId` must be nullable so existing records remain valid. A data migration step is NOT required; existing records simply have `userId = null` and are treated as system templates.
- The user-facing browse API must never expose unpublished (draft) templates. The query must filter `isPublished = true`.
- The `usageCount` increment on select should be atomic (Prisma's `increment` operation) to avoid race conditions.
- Template duplication must deep-copy the JSON `config` field, not just reference it, since JSON is stored by value in PostgreSQL.
- Color swatch extraction on the browse card should read `config.global.colors` from the JSON field and display a small set of representative colors (e.g., background, accent, textPrimary).
- The user-facing page should be a server component for the page shell with a client component for the interactive grid (following the existing app pattern of server components for data fetching, client components for interactivity).
- Authentication for the browse page should use `getCurrentUser()` from `src/lib/auth-helpers.ts` and redirect unauthenticated users to sign in.
- The `selectedTemplateId` on `User` should have an `onDelete: SetNull` behavior so that if a template is deleted, the user's selection is cleared rather than causing a foreign key error.
