# Task Breakdown: Template Background Images

## Overview
Total Tasks: 42 (across 6 task groups)

This feature adds background image support to video templates, allowing admins to upload images (with configurable color overlays) that render behind sequence content in recap videos. It spans the type system, API layer, editor UI, preview panel, and Remotion rendering across both the main Next.js app and the video-gen service.

## Task List

### Type System & Validation

#### Task Group 1: Type Definitions, Defaults, and Validation
**Dependencies:** None

This group establishes the foundation that every other group depends on: the TypeScript interfaces, default values, merge/resolve logic, and config validation. Both type files must remain in sync per the existing SYNC NOTE convention.

- [x] 1.0 Complete type system and validation updates
  - [x] 1.1 Write 6 focused tests for type system and validation changes
    - Test `getEffectiveTemplate()` resolves `backgroundImage` and `backgroundOverlayOpacity` from global defaults when no overrides are set
    - Test `getEffectiveTemplate()` applies per-sequence `backgroundImage` override (e.g., intro has its own image, others inherit global)
    - Test `getEffectiveTemplate()` applies per-sequence `backgroundOverlayOpacity` override
    - Test `validateTemplateConfig` accepts valid config with `backgroundImage` (string URL) and `backgroundOverlayOpacity` (number 0-1) at global and sequence levels
    - Test `validateTemplateConfig` rejects invalid `backgroundOverlayOpacity` values (e.g., -0.1, 1.5, string)
    - Test `validateTemplateConfig` rejects invalid `backgroundImage` values (e.g., number, boolean) while accepting null and string
    - Place video-gen tests in `services/video-gen/src/lib/__tests__/template-types.test.ts`
    - Place validation tests in `__tests__/lib/video/validateTemplateConfig.test.ts`
  - [x] 1.2 Add background image fields to type interfaces in `services/video-gen/src/lib/template-types.ts` (canonical copy)
    - Add `backgroundImage?: string | null` and `backgroundOverlayOpacity?: number | null` to `GlobalTemplateConfig`
    - Add `backgroundImage?: string | null` and `backgroundOverlayOpacity?: number | null` to `IntroConfig`, `BookRevealConfig`, `StatsRevealConfig`, `ComingSoonConfig`, `OutroConfig`
    - Add `backgroundImage: string | null` and `backgroundOverlayOpacity: number` to `ResolvedGlobalConfig`
    - Add `backgroundImage: string | null` and `backgroundOverlayOpacity: number` to `ResolvedIntroConfig`, `ResolvedBookRevealConfig`, `ResolvedStatsRevealConfig`, `ResolvedComingSoonConfig`, `ResolvedOutroConfig`
  - [x] 1.3 Mirror identical type changes to `src/types/video-template.ts` (main app copy)
    - Replicate all interface changes from 1.2 exactly
    - Keep both files structurally identical per SYNC NOTE
  - [x] 1.4 Update `DEFAULT_TEMPLATE` in both type files
    - In `services/video-gen/src/lib/template-types.ts`: set `global.backgroundImage: null`, `global.backgroundOverlayOpacity: 0.7`
    - In `services/video-gen/src/lib/template-types.ts`: set `backgroundImage: null`, `backgroundOverlayOpacity: null` for each sequence (intro, bookReveal, statsReveal, comingSoon, outro) -- null means inherit from global
    - Mirror the same `DEFAULT_TEMPLATE` changes in `src/types/video-template.ts` using hardcoded values (no theme.ts imports)
  - [x] 1.5 Update `getEffectiveTemplate()` in `services/video-gen/src/lib/template-types.ts` with background image fallback resolution
    - After the existing `deepMerge` step, add a post-processing pass
    - For each sequence (intro, bookReveal, statsReveal, comingSoon, outro): if `backgroundImage` is null/undefined, inherit from `resolved.global.backgroundImage`
    - For each sequence: if `backgroundOverlayOpacity` is null/undefined, inherit from `resolved.global.backgroundOverlayOpacity`
    - Note: `deepMerge` currently skips null values from source, so sequence-level nulls will correctly fall through to the post-processing fallback
  - [x] 1.6 Update `validateTemplateConfig` in `src/lib/video/validateTemplateConfig.ts`
    - Add `'backgroundImage'` and `'backgroundOverlayOpacity'` to `GLOBAL_PROPERTIES`
    - Add `'backgroundImage'` and `'backgroundOverlayOpacity'` to `INTRO_PROPERTIES`, `BOOK_REVEAL_PROPERTIES`, `STATS_REVEAL_PROPERTIES`, `COMING_SOON_PROPERTIES`, `OUTRO_PROPERTIES`
    - In `validateGlobalConfig`: validate `backgroundImage` as string or null; validate `backgroundOverlayOpacity` as number between 0-1 (inclusive) or null
    - In each sequence validator (`validateIntroConfig`, `validateBookRevealConfig`, `validateStatsRevealConfig`, `validateComingSoonConfig`, `validateOutroConfig`): add the same validation for `backgroundImage` and `backgroundOverlayOpacity`
  - [x] 1.7 Ensure type system and validation tests pass
    - Run ONLY the tests written in 1.1
    - Run: `npm run test -- __tests__/lib/video/validateTemplateConfig.test.ts`
    - Run: `cd services/video-gen && npx vitest run src/lib/__tests__/template-types.test.ts`
    - Verify TypeScript compilation passes in both the root app and video-gen service

**Acceptance Criteria:**
- The 6 tests written in 1.1 pass
- Both type files have identical background image field additions
- `DEFAULT_TEMPLATE` includes background image defaults in both files
- `getEffectiveTemplate()` correctly resolves per-sequence backgrounds with global fallback
- `validateTemplateConfig` accepts valid background fields and rejects invalid ones
- TypeScript compiles without errors in both packages

---

### API Layer

#### Task Group 2: Presigned URL, Image Processing, and S3 Cleanup Endpoints
**Dependencies:** Task Group 1

This group builds the server-side API infrastructure for uploading, processing, and cleaning up background images. It follows the existing avatar upload pattern (presigned URL then process) and adapts it for 1080x1920 template backgrounds.

- [x] 2.0 Complete API layer for background image management
  - [x] 2.1 Write 8 focused tests for API endpoints
    - Test presigned URL endpoint returns 401 for non-admin users
    - Test presigned URL endpoint returns presigned URL, key, and public URL for valid request
    - Test presigned URL endpoint rejects GIF content type (only JPEG, PNG, WebP allowed)
    - Test presigned URL endpoint rejects file size exceeding 5MB
    - Test background processing POST endpoint returns 400 for missing key or sequence
    - Test background processing DELETE endpoint removes background URL from config
    - Test template DELETE handler cleans up S3 background images from config JSON
    - Test presigned URL endpoint validates sequence parameter against allowed values ('global', 'intro', 'bookReveal', 'statsReveal', 'comingSoon', 'outro')
    - Place tests in `__tests__/api/templates/background.test.ts`
  - [x] 2.2 Create presigned URL endpoint at `src/app/api/templates/[id]/background/presigned-url/route.ts`
    - POST handler with `requireAdmin` guard (use `getCurrentUser` from `@/lib/auth/admin`, check `isAdmin`)
    - Accept `{ contentType, fileSize, sequence }` in request body
    - Validate `sequence` is one of `'global' | 'intro' | 'bookReveal' | 'statsReveal' | 'comingSoon' | 'outro'`
    - Validate `contentType` against JPEG, PNG, WebP only (exclude GIF from `VALID_IMAGE_TYPES`)
    - Validate `fileSize` <= 5MB (reuse `MAX_FILE_SIZE` from `src/lib/s3-upload.ts`)
    - Generate S3 key: `template-backgrounds/{templateId}/{sequence}-{timestamp}.{ext}`
    - Use `getExtensionFromContentType` from `src/lib/s3-upload.ts` for extension
    - Generate presigned URL using `PutObjectCommand` + `getSignedUrl` pattern from `src/lib/s3-upload.ts`
    - Return `{ presignedUrl, key, publicUrl }` using `getS3PublicUrl` from `src/lib/s3.ts`
    - Verify template exists via Prisma lookup before generating URL
  - [x] 2.3 Create background processing endpoint at `src/app/api/templates/[id]/background/route.ts`
    - POST handler: accepts `{ key, sequence }`, downloads image from S3, resizes to 1080x1920 using sharp (`fit: 'cover'`, `position: 'center'`, jpeg quality 85), re-uploads with `-resized.jpg` suffix, deletes original, returns `{ backgroundUrl }`
    - Follow `resizeAvatar` pattern from `src/lib/image-processing.ts` -- adapt dimensions from 200x200 to 1080x1920
    - Verify S3 key starts with `template-backgrounds/` and contains the template ID (security check)
    - Admin auth guard on both handlers
    - DELETE handler: accepts `{ sequence }` in request body, reads template config JSON from database, extracts the background URL for the given sequence (or global), deletes the S3 object via `extractKeyFromUrl` + `deleteAvatar` pattern, returns `{ success: true }`
  - [x] 2.4 Update template DELETE handler in `src/app/api/templates/[id]/route.ts` for S3 cleanup
    - Before deleting the database record, extract all background image URLs from the template config JSON
    - Check `config.global?.backgroundImage` and `config.{sequence}?.backgroundImage` for each of intro, bookReveal, statsReveal, comingSoon, outro
    - For each non-null URL, use `extractKeyFromUrl` to get the S3 key and delete via fire-and-forget (`.catch()` logging, matching avatar cleanup pattern)
    - Import `extractKeyFromUrl` and `deleteAvatar` from `@/lib/s3-upload`
  - [x] 2.5 Ensure API layer tests pass
    - Run ONLY the tests written in 2.1
    - Run: `npm run test -- __tests__/api/templates/background.test.ts`

**Acceptance Criteria:**
- The 8 tests written in 2.1 pass
- Presigned URL endpoint generates correct S3 keys with the `template-backgrounds/` prefix
- Image processing endpoint resizes to 1080x1920 and cleans up originals
- DELETE background endpoint removes S3 objects and returns success
- Template deletion cleans up all associated background images from S3
- All endpoints enforce admin authentication

---

### Editor State Management

#### Task Group 3: Editor Reducer, State, and Config Assembly
**Dependencies:** Task Group 1

This group updates the template editor's `useReducer` state management to track background image URLs and overlay opacity at global and per-sequence levels. It does not include UI rendering (that is Task Group 4).

- [x] 3.0 Complete editor state management for background images
  - [x] 3.1 Write 4 focused tests for editor state management
    - Test `buildInitialState` populates `backgroundImage` and `backgroundOverlayOpacity` from resolved template at global and sequence levels
    - Test `SET_GLOBAL_BACKGROUND_IMAGE` action updates global background image in state
    - Test `SET_GLOBAL_BACKGROUND_OVERLAY_OPACITY` action updates global overlay opacity
    - Test `assembleConfig` includes background image URLs and overlay opacity in the output config JSON at both global and sequence levels
    - Place tests in `__tests__/components/templates/TemplateEditorState.test.ts`
  - [x] 3.2 Add background image fields to `EditorState` interface in `src/components/templates/TemplateEditorClient.tsx`
    - Add to top-level state (global): `globalBackgroundImage: string | null` and `globalBackgroundOverlayOpacity: number`
    - Add to each sequence state object (intro, bookReveal, statsReveal, comingSoon, outro): `backgroundImage: string | null` and `backgroundOverlayOpacity: number | null`
  - [x] 3.3 Add new reducer action types and handlers
    - Add `SET_GLOBAL_BACKGROUND_IMAGE` action type: `{ type: 'SET_GLOBAL_BACKGROUND_IMAGE'; value: string | null }`
    - Add `SET_GLOBAL_BACKGROUND_OVERLAY_OPACITY` action type: `{ type: 'SET_GLOBAL_BACKGROUND_OVERLAY_OPACITY'; value: number }`
    - Per-sequence background fields use existing `SET_INTRO`, `SET_BOOK_REVEAL`, etc. action types with `key: 'backgroundImage'` or `key: 'backgroundOverlayOpacity'`
    - Add reducer cases for the two new global action types
  - [x] 3.4 Update `buildInitialState()` to populate background fields
    - Set `globalBackgroundImage` from `template.global.backgroundImage`
    - Set `globalBackgroundOverlayOpacity` from `template.global.backgroundOverlayOpacity`
    - Set each sequence's `backgroundImage` and `backgroundOverlayOpacity` from the resolved template
  - [x] 3.5 Update `assembleConfig()` to include background fields in output
    - Include `backgroundImage` and `backgroundOverlayOpacity` in the `global` section of the assembled config
    - Include `backgroundImage` and `backgroundOverlayOpacity` in each sequence section (intro, bookReveal, statsReveal, comingSoon, outro)
    - Emit `null` for sequence-level values that match global (to indicate inheritance), or the override value if different
  - [x] 3.6 Update `resolveConfig()` to handle background image fallback for preview accuracy
    - After spreading defaults and initial config, apply the same global-to-sequence fallback logic as `getEffectiveTemplate()`
    - If a sequence's `backgroundImage` is null/undefined, inherit from global
    - If a sequence's `backgroundOverlayOpacity` is null/undefined, inherit from global
  - [x] 3.7 Ensure editor state management tests pass
    - Run ONLY the tests written in 3.1
    - Run: `npm run test -- __tests__/components/templates/TemplateEditorState.test.ts`

**Acceptance Criteria:**
- The 4 tests written in 3.1 pass
- Editor state correctly tracks background image URLs and overlay opacity at global and per-sequence levels
- `buildInitialState` populates background fields from resolved template
- `assembleConfig` produces valid config JSON with background image data
- `resolveConfig` applies global-to-sequence fallback for preview accuracy

---

### Editor UI & Preview Panel

#### Task Group 4: Editor Background Image Sections and Preview Updates
**Dependencies:** Task Groups 2, 3

This group adds the visual UI controls for uploading, previewing, and removing background images in the template editor, plus updates the preview panel to show background image indicators.

- [x] 4.0 Complete editor UI and preview panel for background images
  - [x] 4.1 Write 6 focused tests for editor UI components
    - Test Colors tab renders a "Background Image" section with file upload input and overlay opacity slider
    - Test per-sequence tab (e.g., Intro) renders a "Background Image" section with upload/preview/remove controls
    - Test per-sequence section shows "Inheriting from global" indicator when no sequence-specific override is set
    - Test file upload input accepts only image/jpeg, image/png, image/webp
    - Test overlay opacity slider dispatches correct action with value between 0 and 1
    - Test preview panel renders "Backgrounds" section showing thumbnails for sequences with background images
    - Place tests in `__tests__/components/templates/TemplateEditorBackground.test.tsx`
  - [x] 4.2 Add "Background Image" section to the Colors tab in `renderColorsTab()`
    - Add section at the bottom of the Colors tab, after the existing color groups
    - Section heading: "Background Image" with `h3` tag matching existing styling
    - File upload input: `<input type="file" accept="image/jpeg,image/png,image/webp" />`
    - Thumbnail preview: show current global background image if set (small `<img>` with rounded corners)
    - Overlay opacity slider: `<input type="range" min="0" max="1" step="0.05" />` with current value display
    - Remove button: clears the global background image (dispatches `SET_GLOBAL_BACKGROUND_IMAGE` with `null`)
    - Add `data-testid` attributes: `global-background-upload`, `global-background-preview`, `global-background-opacity`, `global-background-remove`
  - [x] 4.3 Add "Background Image" section to each sequence tab
    - Add section to `renderIntroTab()`, `renderBookRevealTab()`, `renderStatsRevealTab()`, `renderComingSoonTab()`, `renderOutroTab()`
    - Each section includes: file upload, thumbnail preview, overlay opacity slider, remove button
    - Show "Inheriting from global" indicator with muted-style global image thumbnail when no sequence-specific override is set (i.e., sequence `backgroundImage` is null)
    - When a sequence has its own override, show the override image normally with a "Clear override" button
    - Dispatch via existing `SET_INTRO`/`SET_BOOK_REVEAL`/etc. actions with `key: 'backgroundImage'` or `key: 'backgroundOverlayOpacity'`
    - Add `data-testid` attributes per sequence: `{sequence}-background-upload`, `{sequence}-background-preview`, `{sequence}-background-opacity`, `{sequence}-background-remove`
  - [x] 4.4 Implement the upload flow in the editor
    - On file selection: (1) POST to `/api/templates/{id}/background/presigned-url` with `{ contentType, fileSize, sequence }`, (2) PUT file directly to S3 using the returned presigned URL, (3) POST to `/api/templates/{id}/background` with `{ key, sequence }` to trigger resize, (4) Dispatch the returned `backgroundUrl` into editor state
    - Show loading indicator during upload/processing
    - Show error message if any step fails
    - Handle the case where `templateId` is undefined in create mode (disable upload, show message that template must be saved first)
  - [x] 4.5 Update `TemplatePreviewPanel` in `src/components/templates/TemplatePreviewPanel.tsx`
    - Extend `TemplatePreviewPanelProps` to accept optional `backgroundImages` object: `{ global?: string | null; intro?: string | null; bookReveal?: string | null; statsReveal?: string | null; comingSoon?: string | null; outro?: string | null }`
    - Add a "Backgrounds" section after the existing "Layout Summary" section
    - Show small thumbnail previews (48x85px, matching 9:16 aspect ratio) for each sequence that has a background image (either directly or inherited from global)
    - Display overlay opacity value next to each thumbnail
    - When no background images are set at all, omit the section entirely
  - [x] 4.6 Pass background image data from `TemplateEditorClient` to `TemplatePreviewPanel`
    - Construct the `backgroundImages` prop from editor state: map `globalBackgroundImage` to `global`, and each sequence's `backgroundImage` (falling back to global if null) to the respective key
    - Pass the constructed object to `<TemplatePreviewPanel backgroundImages={...} />`
  - [x] 4.7 Ensure editor UI tests pass
    - Run ONLY the tests written in 4.1
    - Run: `npm run test -- __tests__/components/templates/TemplateEditorBackground.test.tsx`

**Acceptance Criteria:**
- The 6 tests written in 4.1 pass
- Colors tab has a "Background Image" section at the bottom with upload, preview, opacity slider, and remove controls
- Each sequence tab has a "Background Image" section with inheritance indicator
- Upload flow correctly chains presigned URL, S3 PUT, and processing calls
- Preview panel shows background image thumbnails with overlay opacity values
- All new controls follow existing editor styling patterns and include `data-testid` attributes

---

### Video-Gen Service (Remotion Rendering)

#### Task Group 5: Remotion Background Image Hook and Sequence Rendering
**Dependencies:** Task Group 1

This group updates the video-gen Remotion service to actually render background images in the video output. It adds a new `useBackgroundImage` hook and modifies each sequence component to conditionally render a background image layer.

- [x] 5.0 Complete Remotion rendering with background images
  - [x] 5.1 Write 5 focused tests for Remotion background image rendering
    - Test `useBackgroundImage('intro')` returns resolved background image URL and opacity from per-sequence override
    - Test `useBackgroundImage('intro')` falls back to global background image when intro has no override
    - Test `useBackgroundImage('intro')` returns `{ backgroundImage: null, backgroundOverlayOpacity: 0.7 }` when no background is set anywhere
    - Test IntroSequence renders `<Img>` element when background image is provided in template context
    - Test IntroSequence does not render background image layer when `backgroundImage` is null (preserves current behavior)
    - Place tests in `services/video-gen/src/lib/__tests__/useBackgroundImage.test.ts` and `services/video-gen/src/compositions/MonthlyRecap/__tests__/BackgroundImage.test.tsx`
  - [x] 5.2 Add `useBackgroundImage()` hook to `services/video-gen/src/lib/TemplateContext.tsx`
    - Accept a `SequenceName` parameter
    - Return `{ backgroundImage: string | null, backgroundOverlayOpacity: number }`
    - Read from `template[sequenceName].backgroundImage` and `template[sequenceName].backgroundOverlayOpacity`
    - Values are already resolved by `getEffectiveTemplate()` (global fallback applied), so the hook just reads from the resolved template
  - [x] 5.3 Update IntroSequence (`services/video-gen/src/compositions/MonthlyRecap/IntroSequence.tsx`)
    - Import `useBackgroundImage` from `TemplateContext` and Remotion's `Img` component
    - Call `useBackgroundImage('intro')` in the main `IntroSequence` component
    - Pass `backgroundImage` and `backgroundOverlayOpacity` to each layout component
    - In each layout (CenteredLayout, SplitLayout, MinimalLayout): conditionally render background image layer when `backgroundImage` is not null
    - Layer order: (1) `<Img src={backgroundImage} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />` as bottommost `<AbsoluteFill>`, (2) color overlay `<AbsoluteFill>` using existing `backgroundColor` at configured `backgroundOverlayOpacity`, (3) existing gradient/grain effects and content unchanged on top
    - When `backgroundImage` is null, render identically to current behavior (no visual change)
  - [x] 5.4 Update BookReveal (`services/video-gen/src/compositions/MonthlyRecap/BookReveal.tsx`)
    - Same pattern as 5.3: import hook, call `useBackgroundImage('bookReveal')`, conditionally render background image layer before existing content layers
  - [x] 5.5 Update StatsReveal (`services/video-gen/src/compositions/MonthlyRecap/StatsReveal.tsx`)
    - Same pattern as 5.3: import hook, call `useBackgroundImage('statsReveal')`, conditionally render background image layer
  - [x] 5.6 Update ComingSoonSequence (`services/video-gen/src/compositions/MonthlyRecap/ComingSoonSequence.tsx`)
    - Same pattern as 5.3: import hook, call `useBackgroundImage('comingSoon')`, conditionally render background image layer
  - [x] 5.7 Update OutroSequence (`services/video-gen/src/compositions/MonthlyRecap/OutroSequence.tsx`)
    - Same pattern as 5.3: import hook, call `useBackgroundImage('outro')`, conditionally render background image layer
  - [x] 5.8 Ensure Remotion rendering tests pass
    - Run ONLY the tests written in 5.1
    - Run: `cd services/video-gen && npx vitest run src/lib/__tests__/useBackgroundImage.test.ts src/compositions/MonthlyRecap/__tests__/BackgroundImage.test.tsx`

**Acceptance Criteria:**
- The 5 tests written in 5.1 pass
- `useBackgroundImage` hook correctly reads resolved background image data from template context
- Each sequence component conditionally renders a background image layer with the correct layering order
- When no background image is set, sequences render identically to their current behavior
- Color overlay renders at the configured opacity on top of the background image

---

### Testing

#### Task Group 6: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-5

- [x] 6.0 Review existing tests and fill critical gaps only
  - [x] 6.1 Review tests from Task Groups 1-5
    - Review the 6 tests from Task Group 1 (type system and validation)
    - Review the 8 tests from Task Group 2 (API endpoints)
    - Review the 4 tests from Task Group 3 (editor state management)
    - Review the 6 tests from Task Group 4 (editor UI)
    - Review the 5 tests from Task Group 5 (Remotion rendering)
    - Total existing tests: 29 tests
  - [x] 6.2 Analyze test coverage gaps for this feature only
    - Identify critical end-to-end workflows that lack coverage
    - Focus on integration points: editor state -> assembleConfig -> API validation -> storage
    - Check that the upload flow (presigned URL -> S3 PUT -> processing -> state update) has adequate coverage
    - Verify the global-to-sequence fallback chain is tested across boundaries (type system through to Remotion rendering)
  - [x] 6.3 Write up to 8 additional strategic tests to fill gaps
    - Integration test: full upload flow from presigned URL through processing to config update (if not covered)
    - Integration test: template duplication preserves background image URLs in config JSON
    - Test: S3 cleanup on template deletion extracts and deletes all background URLs (global + sequences)
    - Test: editor `assembleConfig` with mixed state (some sequences overriding, some inheriting) produces correct config structure
    - Test: `getEffectiveTemplate` with partial config (only global background set, no sequence overrides) resolves all sequences correctly
    - Test: validation accepts config with `backgroundImage: null` at all levels (regression guard)
    - Test: presigned URL endpoint generates correct S3 key pattern with template ID, sequence name, and timestamp
    - Test: background processing endpoint returns 404 for non-existent template
    - Place root tests in `__tests__/integration/template-background-images.test.ts`
    - Place video-gen tests alongside existing test files
  - [x] 6.4 Run all feature-specific tests
    - Run all tests related to this feature (from 1.1, 2.1, 3.1, 4.1, 5.1, and 6.3)
    - Expected total: approximately 29-37 tests
    - Root tests: `npm run test -- __tests__/lib/video/validateTemplateConfig.test.ts __tests__/api/templates/background.test.ts __tests__/components/templates/TemplateEditorState.test.ts __tests__/components/templates/TemplateEditorBackground.test.tsx __tests__/integration/template-background-images.test.ts`
    - Video-gen tests: `cd services/video-gen && npx vitest run src/lib/__tests__/template-types.test.ts src/lib/__tests__/useBackgroundImage.test.ts src/compositions/MonthlyRecap/__tests__/BackgroundImage.test.tsx`
    - Do NOT run the entire application test suite
    - Verify all tests pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 29-37 tests total)
- Critical user workflows for this feature are covered
- No more than 8 additional tests added when filling in testing gaps
- Testing focused exclusively on this spec's feature requirements

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Type System & Validation** -- Foundation that all other groups depend on. Updates both type files, defaults, merge logic, and validation. No external dependencies.
2. **Task Group 2: API Layer** -- Presigned URL, image processing, and S3 cleanup endpoints. Depends on type system for config structure. Can proceed independently of editor UI and Remotion.
3. **Task Group 3: Editor State Management** -- Reducer, state shape, and config assembly. Depends on type system. Can proceed in parallel with Task Group 2.
4. **Task Group 5: Remotion Rendering** -- Hook and sequence component updates. Depends only on Task Group 1 (type system). Can proceed in parallel with Task Groups 2, 3, and 4.
5. **Task Group 4: Editor UI & Preview** -- Visual controls and upload flow. Depends on Task Groups 2 (API endpoints exist to call) and 3 (state management wired up).
6. **Task Group 6: Test Review & Gap Analysis** -- Final integration testing after all groups are complete.

```
Task Group 1 (Types & Validation)
      |
      +---> Task Group 2 (API Layer) --------+
      |                                       |
      +---> Task Group 3 (Editor State) ------+--> Task Group 4 (Editor UI) --> Task Group 6 (Tests)
      |                                       |
      +---> Task Group 5 (Remotion) ----------+
```

## Key Files Modified

### Main App (root)
- `src/types/video-template.ts` -- Type interfaces, resolved types, DEFAULT_TEMPLATE
- `src/lib/video/validateTemplateConfig.ts` -- Config validation property lists and value checks
- `src/lib/s3-upload.ts` -- Referenced (not modified), patterns reused for background key generation
- `src/lib/image-processing.ts` -- Referenced (not modified), pattern adapted for 1080x1920 resize
- `src/app/api/templates/[id]/route.ts` -- DELETE handler updated for S3 background cleanup
- `src/app/api/templates/[id]/background/presigned-url/route.ts` -- New file
- `src/app/api/templates/[id]/background/route.ts` -- New file
- `src/components/templates/TemplateEditorClient.tsx` -- EditorState, reducer, buildInitialState, assembleConfig, resolveConfig, UI render functions
- `src/components/templates/TemplatePreviewPanel.tsx` -- Props extended, "Backgrounds" section added

### Video-Gen Service (services/video-gen)
- `services/video-gen/src/lib/template-types.ts` -- Type interfaces, resolved types, DEFAULT_TEMPLATE, getEffectiveTemplate
- `services/video-gen/src/lib/TemplateContext.tsx` -- New `useBackgroundImage` hook
- `services/video-gen/src/compositions/MonthlyRecap/IntroSequence.tsx` -- Background image layer
- `services/video-gen/src/compositions/MonthlyRecap/BookReveal.tsx` -- Background image layer
- `services/video-gen/src/compositions/MonthlyRecap/StatsReveal.tsx` -- Background image layer
- `services/video-gen/src/compositions/MonthlyRecap/ComingSoonSequence.tsx` -- Background image layer
- `services/video-gen/src/compositions/MonthlyRecap/OutroSequence.tsx` -- Background image layer

### Test Files (new)
- `__tests__/lib/video/validateTemplateConfig.test.ts`
- `__tests__/api/templates/background.test.ts`
- `__tests__/components/templates/TemplateEditorState.test.ts`
- `__tests__/components/templates/TemplateEditorBackground.test.tsx`
- `__tests__/integration/template-background-images.test.ts`
- `services/video-gen/src/lib/__tests__/template-types.test.ts`
- `services/video-gen/src/lib/__tests__/useBackgroundImage.test.ts`
- `services/video-gen/src/compositions/MonthlyRecap/__tests__/BackgroundImage.test.tsx`
