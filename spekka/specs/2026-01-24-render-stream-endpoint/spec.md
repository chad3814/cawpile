# Specification: Render Stream Endpoint

## Goal
Add a GET /render-stream endpoint that streams video render progress via Server-Sent Events (SSE), enabling real-time progress feedback during Remotion video generation with S3 upload upon completion.

## User Stories
- As a client application, I want to receive real-time progress updates during video rendering so that I can display accurate progress to users
- As a client application, I want to receive the S3 URL upon completion so that I can immediately access the rendered video

## Specific Requirements

**GET /render-stream Endpoint**
- Method: GET (required for EventSource/SSE compatibility)
- Path: /render-stream
- Query parameter: `data` containing URL-encoded JSON matching RenderRequest structure
- Must validate request before initiating SSE stream
- Return HTTP 400 for malformed requests with JSON error body

**RenderRequest Query Parameter Structure**
- Parse from URL-decoded `data` query parameter
- Required fields: userId (non-empty string), data (MonthlyRecapExport object)
- Validate data contains meta, books, and stats fields
- Use existing RenderRequest type from src/lib/types.ts

**SSE Response Headers**
- Content-Type: text/event-stream
- Cache-Control: no-cache
- Connection: keep-alive
- Disable response buffering for streaming

**Progress Events**
- Event name: `progress`
- Emit on every integer percentage point change (0, 1, 2, ... 100)
- Data format: `{"progress": <number>, "phase": "<string>"}`
- Phase values: "bundling" for 0-25%, "rendering" for 26-100%
- Track last emitted percentage to avoid duplicate events

**Two-Phase Progress Mapping**
- Bundling phase: Map Remotion bundle onProgress (0-100) to overall 0-25%
- Rendering phase: Map Remotion renderMedia onProgress (0-1) to overall 25-100%
- Formula for bundling: `Math.floor(bundleProgress * 0.25)`
- Formula for rendering: `25 + Math.round(renderProgress * 75)`

**Complete Event**
- Event name: `complete`
- Emit once when render and S3 upload both succeed
- Data format: `{"filename": "<string>", "s3Url": "<string>"}`
- Close SSE connection after sending

**Error Event**
- Event name: `error`
- Emit if render fails at any stage or if S3 upload fails
- Data format: `{"message": "<string>"}`
- Include descriptive error message (e.g., "Render failed: out of memory", "S3 upload failed: access denied")
- Close SSE connection after sending

**Keepalive Mechanism**
- Send SSE comment every 15 seconds during render: `: keepalive\n\n`
- Use setInterval, clear on completion or error
- Prevents proxy/load balancer connection timeouts

**S3 Upload Integration**
- Upload to S3 immediately after successful render (before complete event)
- Use existing generateS3Key and uploadToS3 functions from server/lib/s3.ts
- Delete local file after successful S3 upload using deleteLocalFile
- Preserve local file if S3 upload fails (emit error event instead)

## Existing Code to Leverage

**server/index.ts - POST /render endpoint**
- Request validation pattern for userId and data fields
- Bundling workflow with @remotion/bundler
- renderMedia configuration and progress callback structure
- S3 upload integration pattern with error handling

**server/lib/s3.ts - S3 utilities**
- generateS3Key function for creating S3 object keys
- uploadToS3 function for file upload with error handling
- generatePublicUrl for constructing S3 URLs

**server/lib/cleanup.ts - File cleanup**
- deleteLocalFile function for removing local files after S3 upload

**src/lib/types.ts - Type definitions**
- RenderRequest interface with userId and data fields
- MonthlyRecapExport interface for recap data structure

**src/compositions/MonthlyRecap - Duration calculation**
- calculateDuration function for determining video length from content

## Out of Scope
- Authentication and authorization
- Rate limiting
- Concurrent render limits
- Client disconnect handling and cleanup
- Render cancellation support
- Progress persistence or resume capability
- WebSocket alternative implementation
- Modifications to existing POST /render endpoint
- Changes to GET /download/:filename endpoint
- Unit tests or integration tests
