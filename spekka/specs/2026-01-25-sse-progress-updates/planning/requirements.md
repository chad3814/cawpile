# Spec Requirements: SSE Progress Updates Fix

## Initial Description
Progress updates are not being received during video rendering. The socket may not be flushed properly. Firefox users specifically are not seeing SSE (Server-Sent Events) progress updates. This suggests a cross-browser compatibility or implementation issue with the SSE endpoint.

Reference: GitHub Issue #2 - "progress doesn't update"

## Requirements Discussion

### First Round Questions

**Q1:** Is the issue specific to Firefox only, or do users on Chrome/Safari also experience the problem?
**Answer:** Based on the issue description and codebase research, the issue is reported specifically for Firefox. However, the underlying cause (missing explicit flush after write) would affect all browsers when buffering occurs. Firefox may expose this issue more readily due to its stricter handling of SSE streams.

**Q2:** Does the issue occur when running locally or only in production/Docker?
**Answer:** The codebase shows the server runs in Docker (Dockerfile present with nginx-related headers not currently implemented). The issue likely manifests in both environments, but may be more pronounced in Docker due to additional network layers.

**Q3:** Are progress events never received, or do they arrive all at once at the end?
**Answer:** Based on the reported symptom "progress doesn't update", this strongly suggests events are being buffered and delivered in a batch at connection close rather than streamed in real-time. This is the classic symptom of missing explicit flush calls after `res.write()`.

**Q4:** Is this a new regression or has SSE never worked properly?
**Answer:** The SSE endpoint was added in commit b67db8a on 2026-01-24 (yesterday). This appears to be an initial implementation issue rather than a regression.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: SSE implementation - Path: `/Users/cwalker/Projects/cawpile-video-gen/main/server/lib/sse.ts`
- Feature: Render stream endpoint - Path: `/Users/cwalker/Projects/cawpile-video-gen/main/server/index.ts` (lines 43-160)
- Spec: Render stream implementation - Path: `/Users/cwalker/Projects/cawpile-video-gen/main/spekka/specs/2026-01-24-render-stream-endpoint/spec.md`

### Follow-up Questions

No follow-up questions needed - codebase analysis provides sufficient clarity.

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Root Cause Analysis

After analyzing the codebase, the SSE implementation in `/Users/cwalker/Projects/cawpile-video-gen/main/server/lib/sse.ts` has the following issues:

1. **Missing explicit flush after write operations**: The `sendEvent()` function uses `res.write()` but never calls `res.flush()` afterward. Node.js may buffer these writes, especially when:
   - Running behind a proxy
   - Network conditions cause delays
   - The write buffer isn't full yet

2. **Missing `X-Accel-Buffering: no` header**: This header is critical for nginx/proxy environments to prevent upstream buffering. The current `setupSSEHeaders()` only sets:
   - `Content-Type: text/event-stream`
   - `Cache-Control: no-cache`
   - `Connection: keep-alive`

3. **Potential Firefox-specific behavior**: Firefox may handle SSE buffering differently than Chrome. Firefox over HTTP/1.1 has known connection limits (6 per browser+domain), but the core issue here is buffering, not connection limits.

### Functional Requirements

- FR1: Add explicit `res.flush()` call (or equivalent) after every `res.write()` in SSE event sending
- FR2: Add `X-Accel-Buffering: no` header to prevent proxy buffering
- FR3: Ensure keepalive comments are also flushed immediately
- FR4: Progress events must be received by the client within 100ms of being sent (real-time requirement)
- FR5: Fix must work across Chrome, Firefox, Safari, and Edge browsers
- FR6: Fix must work both locally and in Docker/production environments

### Technical Requirements

- TR1: Modify `sendEvent()` function to flush after write
- TR2: Modify `sendKeepalive()` function to flush after write
- TR3: Add `X-Accel-Buffering: no` header in `setupSSEHeaders()`
- TR4: Consider adding `res.socket?.setNoDelay(true)` to disable Nagle's algorithm for immediate TCP packet sending
- TR5: Update tests to verify flush is called after write operations

### Implementation Details

The fix requires changes to `/Users/cwalker/Projects/cawpile-video-gen/main/server/lib/sse.ts`:

**Current `sendEvent` function (line 47-50):**
```typescript
function sendEvent(res: Response, eventName: string, data: object): void {
  res.write(`event: ${eventName}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}
```

**Issue:** No flush after write - data may be buffered.

**Current `setupSSEHeaders` function (line 35-42):**
```typescript
export function setupSSEHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
}
```

**Issue:** Missing `X-Accel-Buffering: no` header for proxy environments.

### Reusability Opportunities

- The flush pattern should be applied consistently across all SSE write operations
- Consider creating a wrapper function that handles write + flush atomically
- The fix pattern can be reused if additional SSE endpoints are added in the future

### Scope Boundaries

**In Scope:**
- Adding explicit flush calls after SSE writes
- Adding `X-Accel-Buffering: no` header
- Optionally disabling Nagle's algorithm for the SSE socket
- Updating existing SSE tests to verify flush behavior
- Testing fix in Firefox, Chrome, and other major browsers

**Out of Scope:**
- HTTP/2 implementation (would solve Firefox connection limits but is separate concern)
- Client-side EventSource error handling improvements
- Rate limiting or concurrent connection management
- Adding new SSE event types
- Changes to the POST /render endpoint

### Technical Considerations

- **Express/Node.js**: The `res` object in Express extends Node's `http.ServerResponse`. While Express doesn't have a built-in `flush()` method, the underlying Node.js response may use `res.socket.write()` or require `res.flushHeaders()` combined with proper write handling.

- **Alternative flush approaches:**
  1. Use compression middleware with `{ flush: zlib.Z_SYNC_FLUSH }` option
  2. Call `res.socket?.write('')` to force a flush
  3. Use `res.socket?.cork()` / `res.socket?.uncork()` for batched writes
  4. Simply ensure data ends with `\n\n` (SSE spec) which may trigger flush in some scenarios

- **Docker/Proxy considerations:** The Dockerfile runs the Express server directly on port 3001 without nginx in front. However, if deployed behind a load balancer or reverse proxy, the `X-Accel-Buffering: no` header becomes critical.

- **Testing approach:** The existing tests mock `res.write()` but should also verify flush behavior. Consider adding integration tests that verify real-time event delivery.
