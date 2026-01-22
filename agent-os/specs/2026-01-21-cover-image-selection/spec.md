# Specification: Cover Image Selection

## Goal
Allow users to select their preferred cover image from available book providers (Hardcover, Google Books, IBDB) via a new "Cover" tab in the Edit Book Details modal, with automatic fallback when the preferred provider URL becomes invalid.

## User Stories
- As a user, I want to choose which cover image displays for a book in my library so that I can see the cover I prefer
- As a user, I want my cover preference to persist and display consistently across the dashboard so that my library looks the way I want it

## Specific Requirements

**Database Schema Update**
- Add `preferredCoverProvider` field to `UserBook` model in Prisma schema
- Field type: optional String, values: 'hardcover' | 'google' | 'ibdb' | null
- Null value means use default fallback order (Hardcover > Google > IBDB)
- No migration needed for existing records; null is the default behavior

**Cover Tab in EditBookModal**
- Add fourth tab "Cover" to existing tab navigation alongside "Basic Info", "Tracking", "Additional Details"
- Display thumbnails of all available cover images from the edition's providers
- Show placeholder/empty state when no cover images are available from any provider
- Highlight the currently selected cover with a visual indicator (border or checkmark)
- Clicking a thumbnail selects it as the preferred cover

**EditBookModal Props Update**
- Add `edition` prop to EditBookModal to pass provider image data
- Include `hardcoverBook`, `googleBook`, and `ibdbBook` with their `imageUrl` fields
- Add `preferredCoverProvider` to the book prop interface

**API Endpoint Update**
- Update PATCH `/api/user/books/[id]` to accept `preferredCoverProvider` field
- Validate that the value is one of: 'hardcover', 'google', 'ibdb', or null
- Include `preferredCoverProvider` in query response data

**getCoverImageUrl Utility Enhancement**
- Add optional second parameter `preferredProvider?: string | null` to the function
- When `preferredProvider` is set and that provider has a valid imageUrl, return it first
- Fall back to default order (Hardcover > Google > IBDB) if preferred provider has no image
- Maintain backward compatibility for existing calls without the second parameter

**Dashboard Data Flow**
- Add `preferredCoverProvider` to `DashboardBookData` type interface
- Update dashboard queries to include `preferredCoverProvider` from UserBook
- Pass `preferredCoverProvider` to `getCoverImageUrl()` calls in BookCard and BookTable components

**Fallback Behavior**
- When preferred provider URL is null/empty, automatically fall back to next available provider
- Fallback order remains: Hardcover > Google > IBDB
- No user notification needed when fallback occurs; it should happen silently

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**EditBookModal (src/components/modals/EditBookModal.tsx)**
- Existing tab navigation pattern with 3 tabs to extend with 4th "Cover" tab
- Tab state management via `useState<'basic' | 'tracking' | 'additional'>` to extend with 'cover'
- Form submission pattern via `handleSubmit` that calls PATCH API

**getCoverImageUrl (src/lib/utils/getCoverImageUrl.ts)**
- Existing utility implements Hardcover > Google > IBDB fallback priority
- Interface `EditionWithProviders` already defines provider shape
- Simple function signature to extend with optional second parameter

**RereadField (src/components/forms/RereadField.tsx)**
- Example of simple form field component pattern with props interface
- Shows Headless UI component usage for selection state

**PATCH /api/user/books/[id] (src/app/api/user/books/[id]/route.ts)**
- Pattern for extracting fields from request body
- Pattern for conditional updates via `Prisma.UserBookUpdateInput`
- Existing validation pattern for field values

**DashboardBookData (src/types/dashboard.ts)**
- Type already includes edition with provider image data structure
- Pattern for optional nullable fields

## Out of Scope
- Custom cover image upload by users
- Provider labels displayed on cover thumbnails
- Cover preview panel showing larger selected image before saving
- Hiding or disabling the Cover tab when no cover images available
- Cover image URL validation (checking if URL is accessible/broken)
- Admin ability to set default covers for editions
- Bulk cover selection for multiple books
- Cover image caching or optimization
- User preference to disable cover images entirely
- Cover selection during initial book add flow (only available in Edit modal)
