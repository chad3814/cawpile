# Specification: Render Server Origin Environment Variable

## Goal
Enable configurable render server URL via environment variable to support different environments (local development vs production), while adding userId tracking and S3-based video downloads.

## User Stories
- As a developer, I want to configure the render server URL via environment variable so that I can easily switch between local and production render servers
- As the application, I want to track userId in render requests so that the render server can associate renders with specific users

## Specific Requirements

**Environment Variable Configuration**
- Add `NEXT_PUBLIC_RENDER_SERVER_URL` environment variable
- Use `NEXT_PUBLIC_` prefix for client-side accessibility in the React component
- Default to `http://localhost:3001` when the environment variable is not set
- No URL validation required - trust the configured value as-is

**Update /render-stream Endpoint Usage**
- Replace hardcoded `http://localhost:3001` with the environment variable value
- Add `userId` as a query parameter to the SSE URL
- Construct URL as: `${NEXT_PUBLIC_RENDER_SERVER_URL}/render-stream?data=${encodedData}&userId=${userId}`
- The userId should come from the current user session

**Update Complete Event Handler**
- Change video download to use `s3Url` property from the render server response
- Remove dependency on the render server's `/download/` endpoint
- Parse the complete event data to extract the `s3Url` property
- Download the video directly from the S3 URL

**Update .env.example Documentation**
- Add `NEXT_PUBLIC_RENDER_SERVER_URL` entry with production URL as example
- Include comment explaining the purpose and default fallback value
- Place in the "External APIs" or create new "Render Server Configuration" section

**Production Configuration**
- Production URL: `https://render.cawpile.org`
- Document this URL in .env.example as the example value

## Visual Design
No visual assets provided.

## Existing Code to Leverage

**MonthlyRecapModal.tsx (lines 129-215)**
- Contains the existing `handleGenerateVideo` function with hardcoded localhost URL
- Uses EventSource for SSE connection to `/render-stream`
- Has established pattern for progress/complete/error event handling
- Currently downloads from `/download/${filename}` endpoint - needs to change to S3 URL

**.env.example (lines 1-46)**
- Follows established pattern for documenting environment variables
- Uses section headers with comments explaining purpose
- Provides example values and generation instructions where applicable

## Out of Scope
- URL validation logic for the environment variable
- Separate configuration for different endpoints (/render vs /render-stream)
- Any render server-side changes
- Changes to the /render endpoint (only /render-stream is used in MonthlyRecapModal)
- Authentication or authorization changes
- Error handling changes beyond the new response format
- Changes to the JSON export functionality
- Changes to the preview fetching logic
- Server-side API route modifications
