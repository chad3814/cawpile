# Raw Idea

## Bug Description

The cover image shown on a profile page, a shared review, and in the generated share image do not follow the same rules for picking a cover image, and always use the Google Books image. This should be centralized.

## Context

Currently, there is inconsistency in how cover images are selected across different parts of the application:
- Profile pages
- Shared review pages
- Generated share images

All three currently default to using the Google Books image, but they should follow consistent, centralized logic for selecting the best available cover image.

## Expected Outcome

A centralized utility function that determines which cover image to use based on consistent rules, applied uniformly across all three contexts.
