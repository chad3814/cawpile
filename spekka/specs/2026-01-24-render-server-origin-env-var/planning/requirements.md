# Spec Requirements: Render Server Origin Environment Variable

## Initial Description
Add an environment variable to specify the render server origin. This allows the application to connect to the video render server in different environments (local development vs production).

## Requirements Discussion

### First Round Questions

**Q1:** I assume the environment variable will be named something like `RENDER_SERVER_URL` or `NEXT_PUBLIC_RENDER_SERVER_URL`. Which naming convention do you prefer, and does this need to be accessible client-side (NEXT_PUBLIC_ prefix)?
**Answer:** `NEXT_PUBLIC_RENDER_SERVER_URL` - confirmed

**Q2:** Should there be a default fallback value when the environment variable is not set (e.g., `http://localhost:3001` for local development), or should it fail explicitly if not configured?
**Answer:** Fall back to `http://localhost:3001` for local development

**Q3:** Should I update the `.env.example` file to document this new variable?
**Answer:** Yes, update `.env.example`

**Q4:** Should the application validate the URL format on startup or at usage time, or just trust the configured value as-is?
**Answer:** Trust the configured value as-is (no validation needed)

**Q5:** I'm assuming this will be used in the existing render endpoints. Are both `/render` and `/render-stream` endpoints using the same base URL, or do they need separate configuration?
**Answer:** Both endpoints use the same base URL - confirmed

**Q6:** What will the production render server URL be? (For documentation purposes)
**Answer:** `https://render.cawpile.org`

**Q7:** Are there any other changes you'd like made while we're updating these endpoints?
**Answer:**
- Add `userId` as a query parameter in `/render-stream`
- Add `userId` as part of the body in `/render` endpoint
- The render server response will have an `s3Url` property - download the video from that S3 URL instead of the render server's `/download/` endpoint

### Existing Code to Reference
No similar existing features identified for reference.

### Follow-up Questions
None required - user provided comprehensive answers.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements
- Add `NEXT_PUBLIC_RENDER_SERVER_URL` environment variable
- Default to `http://localhost:3001` when not configured
- Update `/render-stream` endpoint to use the environment variable for render server URL
- Update `/render` endpoint to use the environment variable for render server URL
- Add `userId` as a query parameter to `/render-stream` requests
- Add `userId` to the request body for `/render` endpoint
- Download rendered video from the `s3Url` property in the render server response instead of the `/download/` endpoint

### Reusability Opportunities
- None identified by user

### Scope Boundaries
**In Scope:**
- Environment variable configuration (`NEXT_PUBLIC_RENDER_SERVER_URL`)
- Update `.env.example` with documentation
- Modify `/render-stream` endpoint to:
  - Use configurable render server URL
  - Include `userId` as query parameter
- Modify `/render` endpoint to:
  - Use configurable render server URL
  - Include `userId` in request body
  - Download video from `s3Url` response property instead of `/download/` endpoint

**Out of Scope:**
- URL validation logic
- Separate configuration for different endpoints
- Any render server-side changes (those are handled separately)

### Technical Considerations
- Environment variable uses `NEXT_PUBLIC_` prefix for client-side accessibility
- Production URL: `https://render.cawpile.org`
- Local development fallback: `http://localhost:3001`
- Response handling change: Use `s3Url` property from render server response for video download
