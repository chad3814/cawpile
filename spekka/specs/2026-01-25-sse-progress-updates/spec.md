# Specification: SSE Progress Updates Fix

## Goal
Fix SSE progress updates not being received in real-time by adding explicit flush calls after writes and proper proxy-buffering headers to ensure cross-browser compatibility.

## User Stories
- As a client application, I want to receive progress events in real-time (within 100ms of being sent) so that users see accurate rendering progress
- As a Firefox user, I want SSE progress updates to work identically to Chrome so that I have a consistent experience

## Specific Requirements

**Add Explicit Flush After SSE Writes**
- Call flush mechanism after every `res.write()` in the `sendEvent` function
- Call flush mechanism after `res.write()` in the `sendKeepalive` function
- Node.js buffers writes by default; explicit flush forces immediate delivery
- Consider using `res.socket?.write('')` or checking if Express response has native flush

**Add X-Accel-Buffering Header**
- Add `X-Accel-Buffering: no` header in `setupSSEHeaders` function
- This header tells nginx and other proxies to disable upstream buffering
- Critical for Docker/production environments behind reverse proxies

**Disable Nagle's Algorithm**
- Add `res.socket?.setNoDelay(true)` call in `setupSSEHeaders`
- Nagle's algorithm batches small TCP packets for efficiency
- Disabling ensures immediate packet transmission for real-time streaming
- Use optional chaining since socket may not be available in all test scenarios

**Ensure Cross-Browser Compatibility**
- Firefox, Chrome, Safari, and Edge must all receive events in real-time
- Firefox has stricter SSE handling that exposes buffering issues more readily
- The flush pattern resolves the core issue affecting all browsers

**Update Existing Tests**
- Verify flush is called after write operations
- Mock the socket object with setNoDelay method
- Verify X-Accel-Buffering header is set

## Existing Code to Leverage

**server/lib/sse.ts - SSE utility functions**
- `setupSSEHeaders` function to modify (add header and setNoDelay)
- `sendEvent` function to modify (add flush after writes)
- `sendKeepalive` function to modify (add flush after write)
- Follow existing pattern of using Response type from Express
- Maintain existing function signatures and exports

**spekka/specs/2026-01-24-render-stream-endpoint/spec.md**
- Reference implementation context for SSE endpoint
- Original SSE header requirements (Content-Type, Cache-Control, Connection)
- Event format specifications (progress, complete, error, keepalive)

**server/index.ts - Render stream endpoint**
- SSE headers already called via setupSSEHeaders
- No changes needed to endpoint code itself
- Fix propagates automatically through sse.ts utility functions

## Out of Scope
- HTTP/2 implementation for multiplexed connections
- Client-side EventSource error handling or reconnection logic
- Rate limiting or concurrent connection management
- Adding new SSE event types
- Changes to POST /render endpoint
- New integration tests for real-time delivery verification
- WebSocket alternative implementation
- Client disconnect handling improvements
- Compression middleware configuration
- Render cancellation support
