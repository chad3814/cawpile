# Specification: Template Background Images

## Goal
Allow video templates to use uploaded background images (with configurable color overlays) in place of or alongside solid color backgrounds, supporting a global default image with per-sequence overrides.

## User Stories
- As an admin, I want to upload a background image to a video template so that recap videos have richer, more branded visual backgrounds instead of only solid colors.
- As an admin, I want to set a global background image that applies to all sequences, and optionally override it on specific sequences, so I can fine-tune the look of each section independently.

## Specific Requirements

**Type system updates for background image fields**
- Add optional `backgroundImage` (string URL or null) and `backgroundOverlayOpacity` (number 0-1 or null) fields to `GlobalTemplateConfig` in both `src/types/video-template.ts` and `services/video-gen/src/lib/template-types.ts`
- Add the same two optional fields (`backgroundImage`, `backgroundOverlayOpacity`) to each sequence config interface: `IntroConfig`, `BookRevealConfig`, `StatsRevealConfig`, `ComingSoonConfig`, `OutroConfig`
- Add corresponding required fields to each Resolved type: `ResolvedGlobalConfig` gets `backgroundImage: string | null` and `backgroundOverlayOpacity: number`; each resolved sequence config gets the same pair
- Update `DEFAULT_TEMPLATE` in both files to include `backgroundImage: null` and `backgroundOverlayOpacity: 0.7` at global level, and `backgroundImage: null` / `backgroundOverlayOpacity: null` at each sequence level (null means inherit from global)
- Both type files must remain identical in structure per the existing SYNC NOTE convention

**Global-to-per-sequence fallback resolution in getEffectiveTemplate**
- Update `getEffectiveTemplate()` in `services/video-gen/src/lib/template-types.ts` to resolve background image fields with cross-level inheritance: if a sequence's `backgroundImage` is null/undefined after merge, it inherits from `global.backgroundImage`; same for `backgroundOverlayOpacity`
- This fallback logic runs after the existing `deepMerge` step, as a post-processing pass on the resolved template
- The main app copy (`src/types/video-template.ts`) does not contain `getEffectiveTemplate()` so no changes needed there, but the editor's `resolveConfig()` function should handle the same fallback for preview accuracy

**Presigned URL API endpoint for template background uploads**
- Create `src/app/api/templates/[id]/background/presigned-url/route.ts` with a POST handler
- Guard with `requireAdmin` (use `getCurrentUser` from `@/lib/auth/admin` and check `isAdmin`, matching the pattern in existing template routes)
- Accept `{ contentType, fileSize, sequence }` in the request body, where `sequence` is one of `'global' | 'intro' | 'bookReveal' | 'statsReveal' | 'comingSoon' | 'outro'`
- Validate contentType against JPEG, PNG, WebP only (exclude GIF from the existing `VALID_IMAGE_TYPES`); validate fileSize <= 5MB
- Generate S3 key using pattern `template-backgrounds/{templateId}/{sequence}-{timestamp}.{ext}` and return `{ presignedUrl, key, publicUrl }`
- Reuse `s3Client`, `AWS_S3_BUCKET`, `getS3PublicUrl` from `src/lib/s3.ts` and presigned URL generation pattern from `src/lib/s3-upload.ts`

**Background image processing API endpoint**
- Create `src/app/api/templates/[id]/background/route.ts` with POST and DELETE handlers
- POST accepts `{ key, sequence }`, downloads the uploaded image from S3, resizes to 1080x1920 using sharp (fit: cover, position: center, jpeg quality 85), re-uploads with `-resized.jpg` suffix, deletes the original, and returns `{ backgroundUrl }` with the public URL of the processed image
- Follow the exact pattern from `src/lib/image-processing.ts` (`resizeAvatar`), adapting dimensions from 200x200 to 1080x1920
- DELETE accepts `{ sequence }`, extracts the current background URL from the template config JSON, deletes the S3 object, and returns success
- Both handlers verify the template exists and guard with admin auth

**S3 cleanup on template deletion**
- Update the DELETE handler in `src/app/api/templates/[id]/route.ts` to extract all background image URLs from the template config JSON (global + all sequences) and delete each from S3 before deleting the database record
- Use `extractKeyFromUrl` from `src/lib/s3-upload.ts` and fire-and-forget deletion (matching the avatar cleanup pattern)

**Editor state management updates**
- Add `backgroundImage` (string or null) and `backgroundOverlayOpacity` (number) fields to the `EditorState` at the global level, and to each sequence's state object (intro, bookReveal, statsReveal, comingSoon, outro)
- Add new reducer action types: `SET_GLOBAL_BACKGROUND_IMAGE`, `SET_GLOBAL_BACKGROUND_OVERLAY_OPACITY`, and per-sequence actions like `SET_INTRO` already handle arbitrary keys, so background fields can use the existing `SET_INTRO`/`SET_BOOK_REVEAL`/etc. action types with `key: 'backgroundImage'` or `key: 'backgroundOverlayOpacity'`
- Update `buildInitialState()` to populate background fields from the resolved template
- Update `assembleConfig()` to include background image URLs and overlay opacity in the output config JSON

**Editor UI: background image sections**
- Add a "Background Image" section at the bottom of the Colors tab for the global background image, containing: a file upload input (accept image/jpeg, image/png, image/webp), a thumbnail preview of the current image (if set), an overlay opacity slider (range 0-1, step 0.05), and a remove button
- Add a "Background Image" section to each sequence tab (Intro, Book Reveal, Stats Reveal, Coming Soon, Outro) with the same upload/preview/opacity/remove controls
- Per-sequence sections should display an "Inheriting from global" indicator when no sequence-specific override is set, showing the global image thumbnail in a muted style
- Upload flow: (1) request presigned URL from the new API, (2) PUT the file directly to S3, (3) call the processing endpoint to resize and get the final URL, (4) dispatch the URL into editor state
- Follow existing editor styling patterns (TailwindCSS classes, section headings, data-testid attributes)

**Preview panel updates**
- Extend `TemplatePreviewPanelProps` to accept optional `backgroundImages` object with `global` and per-sequence URL fields
- Add a "Backgrounds" section to the preview panel that shows small thumbnail previews for each sequence that has a background image set (either directly or inherited from global)
- Display overlay opacity value next to each thumbnail

**Remotion sequence rendering with background images**
- Add a `useBackgroundImage()` hook to `services/video-gen/src/lib/TemplateContext.tsx` that accepts a `SequenceName` and returns `{ backgroundImage: string | null, backgroundOverlayOpacity: number }` with the resolved values (per-sequence override or global fallback)
- In each sequence component (IntroSequence, BookReveal, StatsReveal, ComingSoonSequence, OutroSequence), conditionally render a background image layer when `backgroundImage` is not null
- Layer order: (1) Remotion `<Img>` with the background image URL, `objectFit: 'cover'`, filling the 1080x1920 frame as the bottommost layer, (2) color overlay `<AbsoluteFill>` using the sequence's existing `backgroundColor` at the configured `backgroundOverlayOpacity`, (3) existing gradient/grain effects and content on top unchanged
- When no background image is set, sequences render identically to current behavior (no visual change)

**Validation updates**
- Add `'backgroundImage'` and `'backgroundOverlayOpacity'` to the allowed property lists in `validateTemplateConfig`: add to `GLOBAL_PROPERTIES`, `INTRO_PROPERTIES`, `BOOK_REVEAL_PROPERTIES`, `STATS_REVEAL_PROPERTIES`, `COMING_SOON_PROPERTIES`, `OUTRO_PROPERTIES`
- Validate `backgroundImage` as a string (URL) or null
- Validate `backgroundOverlayOpacity` as a number between 0 and 1 (inclusive), or null

**Template duplication carries background images**
- When a template is duplicated (creating a new template with the same config JSON), the background image URLs are preserved as-is in the config since they are just S3 public URLs stored in the JSON
- No special handling needed beyond ensuring the config JSON is copied faithfully, but the duplicated template's images point to the same S3 objects as the original (shared references, not copies)
- The S3 cleanup on template deletion must account for this: only delete S3 objects if no other template references the same URL (or accept shared references and skip cleanup on duplication, documenting this as a known trade-off)

## Visual Design
No visual assets were provided.

## Existing Code to Leverage

**Avatar upload flow (presigned URL + sharp resize)**
- `src/lib/s3-upload.ts` provides `generatePresignedUploadUrl`, `deleteAvatar`, `extractKeyFromUrl`, `isValidImageType`, and `MAX_FILE_SIZE`
- `src/lib/image-processing.ts` provides `resizeAvatar` which downloads from S3, resizes with sharp, re-uploads with `-resized.jpg` suffix, and deletes the original -- adapt this pattern for 1080x1920 dimensions
- `src/app/api/user/avatar/presigned-url/route.ts` and `src/app/api/user/avatar/route.ts` demonstrate the two-step upload API pattern (presign then process)

**S3 client and utilities**
- `src/lib/s3.ts` exports the `s3Client` singleton, `AWS_S3_BUCKET`, and `getS3PublicUrl` -- reuse directly for template background operations
- S3 key generation pattern from `generateAvatarKey` in `s3-upload.ts` should be adapted for the `template-backgrounds/{templateId}/{sequence}-{timestamp}.{ext}` pattern

**Template editor component and reducer pattern**
- `src/components/templates/TemplateEditorClient.tsx` uses `useReducer` with typed actions (`EditorAction`), `buildInitialState()`, `assembleConfig()`, and per-tab render functions -- extend this pattern for background image state and UI sections
- The existing tab structure and form styling (TailwindCSS classes, data-testid attributes) should be followed for the new background image controls

**Template type system and merge utilities**
- `services/video-gen/src/lib/template-types.ts` contains the canonical `VideoTemplate` type, `getEffectiveTemplate()`, and `deepMerge()` -- extend these for background image field resolution with global-to-sequence fallback
- `src/types/video-template.ts` is the main app copy that must stay in sync

**Remotion TemplateContext hooks**
- `services/video-gen/src/lib/TemplateContext.tsx` provides `useColors()`, `useTiming()`, `useSequenceConfig()` hooks -- add a new `useBackgroundImage(sequenceName)` hook following the same pattern
- Each sequence component (IntroSequence, BookReveal, StatsReveal, ComingSoonSequence, OutroSequence) already uses these hooks and renders background layers via `<AbsoluteFill>` -- insert the background image layer before the existing gradient layers

## Out of Scope
- Animated or video backgrounds (no GIF, video, or animated format support)
- Background image tiling or repeat patterns
- Per-layout-variant backgrounds (e.g., different image for "centered" vs. "split" intro layouts)
- User-facing background image customization (admin-only for this spec)
- Background image cropping, positioning, or focal point controls within the editor (images are auto-resized to cover the frame)
- Creating separate S3 bucket for template assets (use existing bucket with different key prefix)
- Database schema migration (background image data lives in the existing config JSON column)
- Background image file format conversion to a single format (preserve original format after resize, except converting all to JPEG for consistency as the avatar pipeline does)
- Deduplication of S3 objects when templates share the same background image via duplication
- Undo/redo for background image changes in the editor
