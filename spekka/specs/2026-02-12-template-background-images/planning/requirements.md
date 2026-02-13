# Spec Requirements: Template Background Images

## Initial Description
Allow background images in video templates. Templates currently only support solid color backgrounds -- this adds the ability to set background images for template sequences, stored and served alongside the template configuration.

## Requirements Discussion

### First Round Questions

**Q1:** I assume background images should be configurable per-sequence (e.g., a different background image for Intro vs. BookReveal vs. StatsReveal vs. ComingSoon vs. Outro), rather than a single global background image for the entire video. Is that correct, or should there just be one global background image?
**Answer:** Global + per-sequence override. A global default background image that applies to all sequences, with optional per-sequence overrides.

**Q2:** I assume the background image should work alongside the existing color system rather than replacing it -- meaning when a background image is set, it renders behind an overlay using the existing background color (with configurable opacity), so text remains readable. Is that correct, or should background images fully replace the solid color backgrounds?
**Answer:** Image + configurable overlay. Background image with an adjustable opacity color overlay on top for readability. This means adding an overlay opacity field alongside the background image URL.

**Q3:** For how images interact with the current gradient/effect layers in sequences (e.g., the radial gradient in IntroSequence, the linear gradient in BookReveal, the radial gradient in StatsReveal), I assume we should layer the background image underneath these existing gradient overlays so the template's visual depth is preserved. Is that correct?
**Answer:** (Addressed via Q2) The background image sits behind a configurable color overlay, which preserves the existing layering approach. The existing gradient/effect layers in each sequence would render on top of the image+overlay combination.

**Q4:** I assume images should be uploaded to S3 using the same presigned URL pattern already established for avatar uploads (request presigned URL from API, upload directly from browser to S3, store the public URL in the template config JSON). The S3 key pattern would be something like `template-backgrounds/{templateId}/{sequence}-{timestamp}.{ext}`. Is that the right approach, or do you prefer a different storage strategy?
**Answer:** Use the existing presigned URL pattern from avatar uploads. S3 key pattern like `template-backgrounds/{templateId}/{sequence}-{timestamp}.{ext}`.

**Q5:** For the template editor UI, I assume each sequence tab (Intro, Book Reveal, etc.) should gain a "Background Image" section where the admin can upload/preview/remove an image for that sequence, similar to how the color pickers work today. Should there also be a global-level background image option (on the Colors tab) that applies to all sequences as a default, with per-sequence images overriding it?
**Answer:** Each sequence tab gets a "Background Image" section for upload/preview/remove, plus a global background image option on the Colors tab (or a new dedicated tab/section).

**Q6:** For the video-gen service (Remotion on EC2), the background images need to be accessible via public URL at render time. I assume the images stored in S3 will be publicly readable (like avatar images), and Remotion's `<Img>` component will fetch them directly. Is that correct, or are there access restrictions to consider?
**Answer:** Images publicly readable from S3, Remotion's `<Img>` component fetches directly.

**Q7:** I assume we should support standard web image formats (JPEG, PNG, WebP) with a reasonable file size limit (perhaps 5MB like avatars, or larger since these are video backgrounds at 1080x1920). Should we also do server-side resizing/optimization (like the avatar pipeline with `sharp`), or just accept the uploaded image as-is since the admin controls quality?
**Answer:** JPEG, PNG, WebP. Size limit ~5MB pre-upload. Images will be resized to 1080x1920 server-side using sharp, similar to the avatar resize pipeline.

**Q8:** Is there anything you want explicitly excluded from this spec? For example: animated/video backgrounds, background image tiling/repeat patterns, per-layout-variant backgrounds (e.g., different image for "centered" vs. "split" intro layouts), or user-facing background customization (keeping it admin-only)?
**Answer:** No animated/video backgrounds (no GIF, video, or animated background support). User-facing customization is fine to include eventually but not required for this spec -- keep it admin-only for now.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Avatar Upload (presigned URL flow) - Paths: `src/lib/s3.ts`, `src/lib/s3-upload.ts`, `src/app/api/user/avatar/presigned-url/route.ts`, `src/app/api/user/avatar/route.ts`
- Feature: Avatar Image Processing (sharp resize) - Path: `src/lib/image-processing.ts` (referenced by avatar route, handles server-side resize with sharp)
- Feature: Template Editor (tabbed UI with color pickers, sequence config) - Path: `src/components/templates/TemplateEditorClient.tsx`
- Feature: Template Preview Panel - Path: `src/components/templates/TemplatePreviewPanel.tsx`
- Feature: Template API CRUD - Paths: `src/app/api/templates/route.ts`, `src/app/api/templates/[id]/route.ts`
- Feature: VideoTemplate type definitions - Paths: `src/types/video-template.ts` (main app copy), `services/video-gen/src/lib/template-types.ts` (canonical copy)
- Feature: Template Context (distributes resolved template values to Remotion compositions) - Path: `services/video-gen/src/lib/TemplateContext.tsx`
- Feature: Remotion sequence components (each renders its own background layer) - Path: `services/video-gen/src/compositions/MonthlyRecap/` (IntroSequence.tsx, BookReveal.tsx, StatsReveal.tsx, ComingSoonSequence.tsx, OutroSequence.tsx)
- Feature: Template config validation - Path: `src/lib/video/validateTemplateConfig.ts`
- Feature: Template config merge/resolve with defaults - Path: `services/video-gen/src/lib/template-types.ts` (contains `getEffectiveTemplate()` and `deepMerge()`)

### Follow-up Questions
No follow-up questions were needed.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A -- No visuals were submitted to the planning/visuals/ directory.

## Requirements Summary

### Functional Requirements

**Background Image Configuration (Global + Per-Sequence Override):**
- Add a global background image URL field to the template config that applies as the default background for all sequences
- Add a global background overlay opacity field that controls the opacity of the color overlay rendered on top of the background image
- Add per-sequence background image URL fields (intro, bookReveal, statsReveal, comingSoon, outro) that override the global background image when set
- Add per-sequence background overlay opacity fields that override the global overlay opacity when set
- When no background image is set (globally or per-sequence), sequences render exactly as they do today using solid color backgrounds and existing gradient effects
- When a background image is set, the rendering layer order is: background image (bottom) -> color overlay at configured opacity (middle) -> existing gradient/effects and content (top)

**Image Upload and Storage:**
- Admin uploads background images through the template editor UI
- Upload flow uses presigned S3 URLs, matching the existing avatar upload pattern
- S3 key pattern: `template-backgrounds/{templateId}/{sequence}-{timestamp}.{ext}` (use a key like `global` for the global background)
- Supported formats: JPEG, PNG, WebP
- Pre-upload file size limit: 5MB
- Server-side processing via sharp: resize/optimize uploaded images to 1080x1920 (video frame dimensions) to ensure consistent rendering performance
- Delete the original unprocessed upload from S3 after resize (matching the avatar pipeline behavior)
- When a background image is replaced or removed, clean up the old image from S3

**Template Editor UI (Admin-Only):**
- Add a background image upload/preview/remove section to the global config area (Colors tab or a new dedicated tab/section)
- Add a background image upload/preview/remove section to each sequence tab (Intro, Book Reveal, Stats Reveal, Coming Soon, Outro)
- Each background image section includes: file upload input, image preview thumbnail, overlay opacity slider/input, and a remove/clear button
- Per-sequence sections should indicate when they are inheriting the global background image vs. using their own override
- The preview panel should reflect background image changes (at minimum showing a thumbnail or indicator that a background image is set)

**Template Type System Updates:**
- Add `backgroundImage` (optional string URL) and `backgroundOverlayOpacity` (optional number 0-1) fields to `GlobalTemplateConfig` (or a new nested config within it)
- Add `backgroundImage` (optional string URL) and `backgroundOverlayOpacity` (optional number 0-1) fields to each sequence config interface (IntroConfig, BookRevealConfig, StatsRevealConfig, ComingSoonConfig, OutroConfig)
- Update both type definition files in sync: `src/types/video-template.ts` and `services/video-gen/src/lib/template-types.ts`
- Update the resolved types to include these new fields with sensible defaults (e.g., `backgroundImage: null` or `undefined`, `backgroundOverlayOpacity: 0.7`)
- Update `getEffectiveTemplate()` and `deepMerge()` to handle the new fields, including the global-to-sequence fallback logic
- Update template config validation to accept the new fields

**Remotion Rendering (Video-Gen Service):**
- Update each sequence component (IntroSequence, BookReveal, StatsReveal, ComingSoonSequence, OutroSequence) to conditionally render a background image layer when a background image URL is available (resolved from per-sequence override or global default)
- Use Remotion's `<Img>` component to render the background image with `objectFit: 'cover'` to fill the 1080x1920 frame
- Render the color overlay (using the sequence's existing background color) at the configured opacity on top of the background image
- Existing gradient and grain effects continue to render on top of the overlay, preserving the current visual layering
- The TemplateContext hooks should provide the resolved background image URL and overlay opacity to each sequence (accounting for global fallback)

**API Updates:**
- Add a new API endpoint (or extend existing template endpoints) for generating presigned upload URLs for template background images, with admin auth
- Add a new API endpoint (or extend existing) for completing the upload (triggering sharp resize and returning the processed public URL), with admin auth
- Existing template CRUD endpoints (POST/PATCH) continue to accept the config JSON -- the background image URLs are stored as part of the template config JSON, not as separate database columns
- When a template is deleted, clean up associated background images from S3

### Reusability Opportunities
- S3 client singleton: `src/lib/s3.ts` -- reuse directly
- S3 upload utilities (presigned URL generation, key generation, deletion): `src/lib/s3-upload.ts` -- generalize or create parallel functions for template backgrounds following the same pattern
- Image processing pipeline: `src/lib/image-processing.ts` -- reuse sharp-based resize logic, adapting target dimensions from avatar size to 1080x1920
- Template editor UI patterns: `src/components/templates/TemplateEditorClient.tsx` -- follow the existing tab structure, reducer pattern, and form field styling
- Template preview panel: `src/components/templates/TemplatePreviewPanel.tsx` -- extend to show background image indicators
- Avatar API route patterns: `src/app/api/user/avatar/presigned-url/route.ts` and `src/app/api/user/avatar/route.ts` -- follow the same two-step upload pattern (presigned URL -> complete upload with processing)

### Scope Boundaries

**In Scope:**
- Global background image field with overlay opacity in template config
- Per-sequence background image override fields with overlay opacity in each sequence config
- S3 presigned URL upload flow for template background images (admin-only)
- Server-side image resize/optimization to 1080x1920 via sharp
- Template editor UI: upload, preview, remove background images at global and per-sequence levels
- Overlay opacity control (slider or numeric input) at global and per-sequence levels
- Remotion sequence rendering updates to display background images with color overlay
- Type system updates in both app and video-gen service (kept in sync)
- Template config validation updates for new fields
- S3 cleanup on image replacement, removal, and template deletion
- Preview panel updates to indicate background image presence

**Out of Scope:**
- Animated or video backgrounds (no GIF, video, or animated format support)
- Background image tiling or repeat patterns
- Per-layout-variant backgrounds (e.g., different image for "centered" vs. "split" intro layouts)
- User-facing background image customization (admin-only for this spec; user customization is a future enhancement)
- Background image cropping or positioning controls within the editor (images are auto-resized to cover the frame)

### Technical Considerations
- The VideoTemplate type definitions must remain in sync between `src/types/video-template.ts` (main app) and `services/video-gen/src/lib/template-types.ts` (video-gen service) -- both files need identical type changes
- The `DEFAULT_TEMPLATE` constant in both files needs updated with default values for the new background image fields
- The `getEffectiveTemplate()` function in the video-gen service needs logic to resolve per-sequence background images with global fallback -- if a sequence has no `backgroundImage` set, it should inherit from `global.backgroundImage`
- The `deepMerge()` utility in template-types.ts may need adjustment to handle the fallback pattern (global -> per-sequence) since the current merge only applies defaults, not cross-level inheritance
- Template config is stored as a JSON column (`config Json`) in the `VideoTemplate` Prisma model -- no schema migration needed for adding fields to the config, but the validation logic in `src/lib/video/validateTemplateConfig.ts` must be updated
- S3 bucket: determine whether to use the existing `cawpile-avatars-v2` bucket with a different key prefix, or a separate bucket for template assets
- Background images at 1080x1920 may be larger than avatar images even after optimization -- consider whether the 5MB pre-upload limit is sufficient and whether the processed images need a target file size or quality setting
- The video-gen service runs on EC2 with Docker -- Remotion's `<Img>` component will fetch background images from S3 public URLs at render time, so network latency between EC2 and S3 should be minimal (same AWS region)
- The editor's `useReducer` state management pattern in `TemplateEditorClient.tsx` will need new action types for setting/clearing background image URLs and overlay opacity values at both global and per-sequence levels
- The `assembleConfig()` function in the editor needs to include background image URLs and overlay opacity in the config object sent to the API
