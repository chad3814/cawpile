# Spec Requirements: Render Stream Endpoint

## Initial Description

Create the /render-stream endpoint for SSE progress streaming during Remotion video renders. The endpoint accepts recap data as a URL-encoded JSON query parameter and streams progress via Server-Sent Events (SSE) with three event types: progress, complete, and error. Uses Remotion's renderMedia onProgress callback with proper SSE headers.

## Requirements Discussion

### First Round Questions

**Q1:** Should the complete event include just the filename, or also the S3 URL where the video is uploaded?
**Answer:** Upload to S3 after render completes, include s3Url in complete event.

**Q2:** The query parameter structure - should it be just the recap data, or include additional metadata like userId for S3 path organization?
**Answer:** Include userId - use full RenderRequest structure with userId and data fields.

**Q3:** Progress granularity - emit on every frame, every percentage point change, or at fixed intervals?
**Answer:** Emit progress events on every percentage point change (0, 1, 2, ... 100).

**Q4:** If S3 upload fails after successful render, should this emit an error event or a complete event with upload failure info?
**Answer:** Emit error event if S3 upload fails after render completes (not complete event).

**Q5:** For malformed query parameters, should the endpoint return HTTP 400 immediately or initiate SSE and send an error event?
**Answer:** Return HTTP 400 for malformed query params before initiating SSE stream.

**Q6:** Should bundling phase progress be included, or only the actual render progress?
**Answer:** Include bundling phase in progress reporting (bundling: 0-25%, rendering: 25-100%).

**Q7:** Keepalive comments - implement as standard feature or make configurable?
**Answer:** Implement 15-second keepalive comment as standard feature.

**Q8:** Any specific features to exclude from initial implementation?
**Answer:** Exclude: authentication/authorization, rate limiting, concurrent render limits, client disconnect handling.

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

None required - all requirements clearly defined.

## Visual Assets

### Files Provided:

No visual assets provided.

## Requirements Summary

### Functional Requirements

**Endpoint Definition**
- Method: GET
- Path: /render-stream
- Purpose: Stream video render progress via Server-Sent Events

**Request Format**
- Query parameter: `data` containing URL-encoded JSON
- JSON structure (RenderRequest):
  ```json
  {
    "userId": "string",
    "data": {
      "monthName": "string",
      // ... other recap data fields
    }
  }
  ```

**Response Headers**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**SSE Event Types**

1. **Progress Event**
   - Event name: `progress`
   - Emitted on every percentage point change (0, 1, 2, ... 100)
   - Data format:
     ```json
     {"progress": 45, "phase": "rendering"}
     ```
   - Phase values: `"bundling"` (0-25%) or `"rendering"` (25-100%)

2. **Complete Event**
   - Event name: `complete`
   - Emitted once when render and S3 upload both succeed
   - Data format:
     ```json
     {
       "filename": "recap-2026-01.mp4",
       "s3Url": "https://bucket.s3.region.amazonaws.com/userId/recap-2026-01.mp4"
     }
     ```

3. **Error Event**
   - Event name: `error`
   - Emitted if render fails OR if S3 upload fails after successful render
   - Data format:
     ```json
     {"message": "Render failed: out of memory"}
     ```
     or
     ```json
     {"message": "S3 upload failed: access denied"}
     ```

**Progress Phase Breakdown**
- Bundling phase: 0-25% of total progress
  - Remotion bundle preparation
  - Progress events: 0, 1, 2, ... 25
- Rendering phase: 25-100% of total progress
  - Actual video frame rendering
  - Maps Remotion's 0-100% to 25-100%
  - Progress events: 26, 27, 28, ... 100

**Keepalive Mechanism**
- Send SSE comment every 15 seconds during render
- Format: `: keepalive\n\n`
- Purpose: Prevent proxy/load balancer connection timeouts

**Error Handling**

1. Malformed query parameters:
   - Return HTTP 400 Bad Request immediately
   - Do NOT initiate SSE stream
   - Response body: `{"error": "Invalid request: <specific reason>"}`

2. Render failure:
   - Emit error event with descriptive message
   - Close SSE connection

3. S3 upload failure (after successful render):
   - Emit error event (not complete event)
   - Include upload error details in message
   - Close SSE connection

### Reusability Opportunities

- Existing S3 upload logic from current render pipeline can be reused
- Remotion renderMedia configuration patterns from existing /render endpoint

### Scope Boundaries

**In Scope:**
- GET /render-stream endpoint with SSE response
- Query parameter parsing with userId and data structure
- Progress events on every percentage point (0-100)
- Two-phase progress reporting (bundling + rendering)
- Complete event with filename and s3Url
- Error events for render and S3 upload failures
- HTTP 400 for malformed requests (pre-SSE)
- 15-second keepalive comments
- S3 upload after render completion

**Out of Scope:**
- Authentication/authorization
- Rate limiting
- Concurrent render limits
- Client disconnect handling/cleanup
- Render cancellation
- Progress persistence/resume
- WebSocket alternative implementation

### Technical Considerations

**Remotion Integration**
- Use `renderMedia` with `onProgress` callback
- onProgress receives `{ progress: number }` where progress is 0-1
- Map to percentage: `Math.round(progress * 100)`
- For rendering phase: `25 + Math.round(progress * 75)`

**Bundling Progress**
- Remotion bundling happens before renderMedia
- May need to hook into bundle process or estimate bundling time
- Emit progress 0-25 during bundling phase

**S3 Upload**
- Upload occurs after render completes successfully
- Use userId from request to organize S3 paths
- S3 key pattern: `{userId}/{filename}`
- Return full S3 URL in complete event

**Express/Node.js Considerations**
- Disable response buffering for SSE
- Handle connection properly for streaming
- Implement keepalive timer (setInterval, clear on completion/error)

**Query Parameter Validation**
- Validate JSON structure before starting SSE
- Required fields: userId (string), data (object)
- Return 400 with specific error message for validation failures
