# Task Breakdown: SSE Progress Updates Fix

## Overview
Total Tasks: 12

This is a focused bug fix for SSE progress updates not being received in real-time. The fix requires modifications to the SSE utility functions in `server/lib/sse.ts` to add explicit flush calls, proxy-buffering headers, and disable Nagle's algorithm.

## Task List

### SSE Infrastructure Layer

#### Task Group 1: SSE Header and Socket Configuration
**Dependencies:** None

- [x] 1.0 Complete SSE header configuration updates
  - [x] 1.1 Write 3-4 focused tests for SSE header configuration
    - Test that X-Accel-Buffering header is set to 'no'
    - Test that setNoDelay is called on socket when socket exists
    - Test that existing headers (Content-Type, Cache-Control, Connection) still work
    - Test graceful handling when socket is undefined
  - [x] 1.2 Add X-Accel-Buffering header in setupSSEHeaders
    - Add `res.setHeader('X-Accel-Buffering', 'no')` before flushHeaders call
    - This prevents nginx and other proxies from buffering the SSE stream
    - File: `/Users/cwalker/Projects/cawpile-video-gen/main/server/lib/sse.ts`
  - [x] 1.3 Disable Nagle's algorithm in setupSSEHeaders
    - Add `res.socket?.setNoDelay(true)` after setting headers
    - Use optional chaining for test compatibility
    - Forces immediate TCP packet transmission
  - [x] 1.4 Ensure header configuration tests pass
    - Run ONLY the 3-4 tests written in 1.1
    - Verify all headers are correctly set
    - Verify setNoDelay is properly called

**Acceptance Criteria:**
- The 3-4 tests written in 1.1 pass
- X-Accel-Buffering: no header is present in SSE responses
- setNoDelay(true) is called when socket is available
- Existing SSE header functionality unchanged

---

#### Task Group 2: SSE Write Flush Implementation
**Dependencies:** Task Group 1

- [x] 2.0 Complete SSE write flush implementation
  - [x] 2.1 Write 4-5 focused tests for flush behavior
    - Test that flush is called after sendEvent writes
    - Test that flush is called after sendKeepalive write
    - Test flush works with mock socket
    - Test graceful handling when socket is undefined
    - Test event data format is preserved after flush
  - [x] 2.2 Implement flush mechanism for sendEvent function
    - Add flush call after `res.write()` operations in sendEvent
    - Consider using `res.socket?.write('')` to force flush
    - Alternative: `(res as any).flush?.()` if compression middleware installed
    - Maintain existing function signature
    - File: `/Users/cwalker/Projects/cawpile-video-gen/main/server/lib/sse.ts`
  - [x] 2.3 Implement flush mechanism for sendKeepalive function
    - Add flush call after `res.write(':keepalive\n\n')`
    - Use same flush pattern as sendEvent for consistency
    - Keepalive must also be flushed immediately
  - [x] 2.4 Ensure flush implementation tests pass
    - Run ONLY the 4-5 tests written in 2.1
    - Verify flush is called after every write
    - Verify event format is unchanged

**Acceptance Criteria:**
- The 4-5 tests written in 2.1 pass
- Flush is called after every res.write() operation
- SSE events are delivered within 100ms of being sent
- Existing event format (event name + JSON data) unchanged

---

### Testing Layer

#### Task Group 3: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-2

- [x] 3.0 Review existing tests and fill critical gaps
  - [x] 3.1 Review tests from Task Groups 1-2
    - Review the 3-4 header configuration tests from Task 1.1
    - Review the 4-5 flush behavior tests from Task 2.1
    - Total existing tests: approximately 7-9 tests
  - [x] 3.2 Analyze test coverage gaps for this fix only
    - Check if integration between header setup and flush is tested
    - Verify cross-function behavior is covered
    - Focus ONLY on SSE fix requirements
  - [x] 3.3 Write up to 4 additional strategic tests if needed
    - Test complete SSE setup flow (headers + flush in combination)
    - Test that progress event with flush reaches mock client
    - Test error event with flush behavior
    - Test complete event with flush behavior
  - [x] 3.4 Run feature-specific tests only
    - Run ONLY tests related to SSE functionality
    - Expected total: approximately 11-13 tests maximum
    - Verify all SSE-related tests pass
    - Do NOT run the entire application test suite

**Acceptance Criteria:**
- All SSE-specific tests pass (approximately 11-13 tests total)
- Header configuration and flush behavior are fully covered
- No more than 4 additional tests added
- Testing focused exclusively on SSE fix requirements

---

### Verification Layer

#### Task Group 4: Cross-Browser Compatibility Verification
**Dependencies:** Task Groups 1-3

- [x] 4.0 Verify cross-browser SSE functionality
  - [x] 4.1 Manual verification checklist creation
    - Document steps to test SSE in Firefox
    - Document steps to test SSE in Chrome
    - Document expected behavior (real-time progress updates)
    - Include Docker environment testing steps
  - [x] 4.2 Verify fix addresses root cause
    - Confirm res.write() followed by flush pattern
    - Confirm X-Accel-Buffering header present
    - Confirm setNoDelay is called
    - Review against requirements FR1-FR6

**Acceptance Criteria:**
- Manual verification checklist created for QA
- All technical requirements TR1-TR5 are addressed in code
- Fix is ready for cross-browser testing

## Execution Order

Recommended implementation sequence:
1. SSE Header and Socket Configuration (Task Group 1)
2. SSE Write Flush Implementation (Task Group 2)
3. Test Review and Gap Analysis (Task Group 3)
4. Cross-Browser Compatibility Verification (Task Group 4)

## Files to Modify

| File | Changes |
|------|---------|
| `/Users/cwalker/Projects/cawpile-video-gen/main/server/lib/sse.ts` | Add X-Accel-Buffering header, setNoDelay call, flush after writes |
| `/Users/cwalker/Projects/cawpile-video-gen/main/server/lib/sse.test.ts` | Update tests to verify new behaviors |

## Notes

- This is a bug fix, not a new feature - keep changes minimal and focused
- The fix propagates automatically to the render stream endpoint via the shared sse.ts utility
- No changes needed to server/index.ts - the endpoint already uses setupSSEHeaders
- Firefox was the primary reporter but fix benefits all browsers
- Consider creating a wrapper function for write+flush if the pattern is repeated
