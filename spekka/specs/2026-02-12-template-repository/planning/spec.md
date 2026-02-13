# Specification: Template Repository

## Goal
Allow authenticated users to browse, select, and duplicate published video templates created by admins, enabling personalized recap video styling without requiring template creation privileges.

## User Stories
- As an authenticated user, I want to browse a gallery of published video templates so that I can choose one for my monthly recap video.
- As an authenticated user, I want to duplicate a template so that I have a personal copy I can use (and eventually customize in a future spec).
- As an admin, I want to publish and unpublish templates so that I control which templates are available in the public repository.

## Specific Requirements

**Prisma Schema: VideoTemplate changes**
- Add `userId` (String, optional/nullable) with a relation to `User`. Nullable so existing records remain valid as system templates with `userId = null`.
- Add `isPublished` (Boolean, default false) to control visibility in the public browse view.
- Add `usageCount` (Int, default 0) to track selection popularity for sorting.
- Add a `creator` relation field on `VideoTemplate` pointing to `User`, and a `createdTemplates` back-relation on `User`.
- Add `@@index([isPublished, createdAt])` for efficient browse queries filtering on published status.
- Create a Prisma migration for these changes. The migration must be additive-only (no data migration needed).

**Prisma Schema: User changes**
- Add `selectedTemplateId` (String, optional/nullable) with a relation to `VideoTemplate`.
- Use `onDelete: SetNull` on the relation so deleting a template clears the user's selection rather than causing a foreign key error.
- The `selectedTemplateId` is consumed by the existing `/api/recap/monthly` flow in future specs.

**Admin API: Extend existing routes**
- `GET /api/templates`: Add optional `isPublished` query parameter to filter. Continue returning all templates (published and unpublished) for admins. Include the `creator` relation (select `name`, `image`) in the response.
- `POST /api/templates`: Accept optional `isPublished` field in the request body. Auto-set `userId` to the creating admin's ID. Continue using `validateTemplateConfig`, `logAdminAction`, and admin auth guards.
- `PATCH /api/templates/[id]`: Accept `isPublished` in the update body. Track `isPublished` changes in audit logging via `logFieldChanges`.
- `DELETE /api/templates/[id]`: No functional changes needed, but note that deleting a template will `SetNull` any user's `selectedTemplateId` referencing it.

**User API: GET /api/user/templates (browse)**
- Requires authenticated user via `getCurrentUser()` from `src/lib/auth-helpers.ts`. No admin check.
- Returns only templates where `isPublished = true`. Never expose unpublished/draft templates.
- Support pagination via `limit` (default 12) and `offset` query parameters. Return `totalCount` alongside `templates` array.
- Support sorting via `sort` query parameter: `newest` (createdAt desc, default), `name` (alphabetical asc), `popular` (usageCount desc).
- Support search via `search` query parameter, filtering by template name (case-insensitive contains).
- Include creator info in each template: `creator: { name, image }` from the User relation. Templates with `userId = null` should return `creator: null` (the UI will display "System" for these).
- Include the user's `selectedTemplateId` in the response metadata so the UI can highlight the currently selected template.

**User API: GET /api/user/templates/[id] (detail)**
- Requires authenticated user. Returns a single template's full details.
- Return 404 if the template does not exist OR is not published (do not distinguish between these cases).
- Include creator info and the full `config` JSON.

**User API: POST /api/user/templates/[id]/select**
- Requires authenticated user. Sets the template as the user's selected template for recap rendering.
- Update the user's `selectedTemplateId` to the given template ID.
- Atomically increment the template's `usageCount` using Prisma's `increment` operation to avoid race conditions.
- Return 404 if the template does not exist or is not published.
- If the user already has this template selected, still return success (idempotent) but do not increment `usageCount` again.

**User API: POST /api/user/templates/[id]/duplicate**
- Requires authenticated user. Creates a personal (unpublished) copy of the template.
- New record gets: `userId` = current user, `isPublished = false`, `name` = "Copy of [original name]", `config` = deep copy of original JSON, `description` = copied, `previewThumbnailUrl` = copied, `usageCount = 0`.
- Return 404 if the source template does not exist or is not published.
- Validate the copied config using `validateTemplateConfig` before saving, as a safeguard.
- Return the newly created template record.

**Browse page: /dashboard/templates**
- Server component page shell at `src/app/dashboard/templates/page.tsx` that fetches the current user and redirects unauthenticated users.
- Client component `TemplateBrowseClient` handles the interactive grid, search, sort, and pagination state.
- Card-based responsive grid layout (3 columns on desktop, 2 on tablet, 1 on mobile).
- Each card displays: preview thumbnail (from `previewThumbnailUrl`, with a placeholder if null), template name, creator name (or "System" for null creator), and 3-5 color swatches extracted from `config.global.colors` (show `background`, `accent`, `textPrimary`, `accentSecondary` as small circular swatches).
- Cards that match the user's `selectedTemplateId` should display a visual "Selected" indicator (e.g., a checkmark badge or highlighted border).
- Sort dropdown with options: Newest, Name, Most Popular.
- Search input for filtering by template name (debounced, resets pagination).

**Template detail view**
- Accessible via clicking a card or navigating to `/dashboard/templates/[id]`.
- Shows: name, description, creator name and avatar, full-size preview thumbnail, complete color palette from `config.global.colors` (all color keys rendered as labeled swatches), font names from `config.global.fonts`, and layout choices for each sequence section (intro, bookReveal, statsReveal, comingSoon, outro).
- "Select for My Recap" button: calls `POST /api/user/templates/[id]/select`, updates UI to show "Selected" state.
- "Duplicate" button: calls `POST /api/user/templates/[id]/duplicate`, shows success confirmation.
- Back navigation link to the browse grid.

**My Templates section on browse page**
- Above the public repository grid, show a "My Templates" section listing the user's personal (duplicated) templates where `userId = currentUser.id` and `isPublished = false`.
- This section is only visible if the user has at least one personal template copy.
- Personal template cards use the same card component as the public grid.
- Users can select their personal copies for use in recaps, using the same select flow.

## Visual Design
No visual mockups were provided for this spec.

## Existing Code to Leverage

**Admin template API routes (`src/app/api/templates/route.ts` and `[id]/route.ts`)**
- These routes already implement full CRUD with admin auth, config validation via `validateTemplateConfig`, and audit logging via `logAdminAction`/`logFieldChanges`.
- Extend these in place to handle the new `isPublished` and `userId` fields rather than creating new admin routes.
- Follow the same error handling and response patterns (e.g., `{ template }` or `{ templates }` response shape).

**Template config validator (`src/lib/video/validateTemplateConfig.ts`)**
- Reuse during template duplication to validate the deep-copied config JSON before saving.
- Already handles all sequence types, color/font/timing validation, and unknown property rejection.

**Pagination component (`src/components/admin/Pagination.tsx`)**
- Reusable client component with page numbers, prev/next buttons, and items-per-page selector.
- Adapt for the user-facing browse page (may need styling adjustments for dark mode support).

**DashboardClient pattern (`src/components/dashboard/DashboardClient.tsx`)**
- Demonstrates the server-component-shell + client-component-interactive pattern used across the app.
- Follow the same `useState` pattern for sort, layout, and tab state management.

**Auth helpers (`src/lib/auth-helpers.ts` and `src/lib/auth/admin.ts`)**
- Use `getCurrentUser()` from `auth-helpers.ts` for all user-facing API routes and pages.
- Continue using `getCurrentUser()` from `auth/admin.ts` (which wraps the same function with admin checks) for admin API routes.

## Out of Scope
- Template editing UI (no form for creating or modifying template configs)
- Video rendering or live preview generation
- Template rating, reviewing, or commenting
- Template tags, categories, or filtering by category
- Template sharing between non-admin users
- Template import/export functionality
- Social features around templates (likes, follows, notifications)
- Admin UI changes for managing the new fields (admin API routes are extended, but no new admin UI pages)
- Generating or updating `previewThumbnailUrl` images (thumbnails are managed externally)
- Deselecting a template (user can only switch selection, not clear it)
