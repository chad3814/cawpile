# Requirements: Cover Image Selection

## Raw Idea
Allow users to pick among the available cover images for the books in their library via a new tab in the Edit Book Details modal.

## Clarifying Questions & Answers

### 1. Cover Source Display
**Question:** Should the tab show which provider each cover comes from (e.g., "Hardcover", "Google Books", "IBDB"), or just display the images without labels?

**Answer:** Images without labels

### 2. Selection Persistence
**Question:** When a user selects a preferred cover, where should this be stored?
- Option A: Add a `preferredCoverProvider` field to `UserBook` (user-level preference per book)
- Option B: Add a `preferredCoverUrl` field to `UserBook` (store the actual URL)
- Option C: Add a `coverPriority` to `Edition` (affects all users with this edition)

**Answer:** Option A - Add `preferredCoverProvider` field to `UserBook`

### 3. Empty State
**Question:** If a book only has one cover image (or none), should the tab still appear? Or should it be hidden/disabled when there's nothing to choose from?

**Answer:** Tab should still appear and be enabled even with one or no covers

### 4. Custom Cover Upload
**Question:** Should users be able to upload their own cover image, or only choose from existing provider images?

**Answer:** Only pick from provider images (no custom upload)

### 5. Preview Behavior
**Question:** When selecting a cover in the modal, should there be a preview of how it will look, or just thumbnails to click?

**Answer:** Just thumbnails to click (no preview)

### 6. Fallback Behavior
**Question:** If a user selects a cover from a provider and that URL later becomes invalid, should we fall back, show "No Cover", or show broken image?

**Answer:** Fall back to next available provider automatically

## Technical Context

### Existing Architecture
- EditBookModal has 3 tabs: "Basic", "Tracking", "Additional"
- Cover images stored in provider tables: `GoogleBook`, `HardcoverBook`, `IbdbBook`
- Each provider table has an `imageUrl` field
- `getCoverImageUrl()` utility implements Hardcover > Google > IBDB fallback

### Database Changes Required
- Add `preferredCoverProvider` field to `UserBook` model
- Values: 'hardcover' | 'google' | 'ibdb' | null (null = use default fallback)

### UI Changes Required
- Add "Cover" tab to EditBookModal
- Display available cover thumbnails from all providers
- Allow clicking to select preferred cover
- Show selected state on current/preferred cover

## Out of Scope
- Custom cover image upload
- Provider labels on cover images
- Cover preview before selection
- Hiding the tab when no covers available

## Visual Assets
No visual assets provided.
