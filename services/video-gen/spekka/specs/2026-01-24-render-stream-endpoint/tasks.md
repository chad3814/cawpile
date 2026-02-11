# Task Breakdown: Render Stream Endpoint

## Overview
Total Tasks: 19
Estimated Task Groups: 4

This feature adds a GET /render-stream endpoint that streams video render progress via Server-Sent Events (SSE), enabling real-time progress feedback during Remotion video generation with S3 upload upon completion.

## Task List

### SSE Infrastructure Layer

#### Task Group 1: SSE Utilities and Types
**Dependencies:** None

- [x] 1.0 Complete SSE infrastructure layer
  - [x] 1.1 Write 4-6 focused tests for SSE utilities
    - Test SSE header setup function
    - Test progress event formatting (event name, data JSON)
    - Test complete event formatting with filename/s3Url
    - Test error event formatting with message
    - Test keepalive comment format
  - [x] 1.2 Create SSE types in `server/lib/sse.ts`
    - `SSEProgressEvent` interface with progress (number) and phase (string)
    - `SSECompleteEvent` interface with filename and s3Url
    - `SSEErrorEvent` interface with message
    - `SSEPhase` type: "bundling" | "rendering"
  - [x] 1.3 Implement SSE helper functions in `server/lib/sse.ts`
    - `setupSSEHeaders(res: Response)`: Set Content-Type, Cache-Control, Connection headers
    - `sendProgressEvent(res: Response, progress: number, phase: SSEPhase)`: Format and send progress
    - `sendCompleteEvent(res: Response, filename: string, s3Url: string)`: Format and send complete
    - `sendErrorEvent(res: Response, message: string)`: Format and send error
    - `sendKeepalive(res: Response)`: Send `: keepalive\n\n` comment
  - [x] 1.4 Implement progress mapping utilities in `server/lib/sse.ts`
    - `mapBundleProgress(bundleProgress: number): number`: Map 0-100 to 0-25
    - `mapRenderProgress(renderProgress: number): number`: Map 0-1 to 25-100
    - Use formulas: `Math.floor(bundleProgress * 0.25)` and `25 + Math.round(renderProgress * 75)`
  - [x] 1.5 Ensure SSE utility tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify all event formatting is correct
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 1.1 pass
- SSE events follow correct format: `event: <name>\ndata: <json>\n\n`
- Progress mapping correctly distributes 0-25% for bundling, 25-100% for rendering
- Keepalive comment format is `: keepalive\n\n`

### Request Validation Layer

#### Task Group 2: Query Parameter Parsing and Validation
**Dependencies:** Task Group 1

- [x] 2.0 Complete request validation layer
  - [x] 2.1 Write 4-6 focused tests for request validation
    - Test valid URL-encoded JSON parsing from `data` query param
    - Test missing `data` query parameter returns 400
    - Test malformed JSON returns 400
    - Test missing userId returns 400 with specific error
    - Test missing data.meta/books/stats returns 400
  - [x] 2.2 Create validation types in `server/lib/validation.ts`
    - `ValidationResult` interface: `{ valid: true, data: RenderRequest } | { valid: false, error: string }`
  - [x] 2.3 Implement query parameter validation in `server/lib/validation.ts`
    - `parseRenderStreamQuery(queryData: string | undefined): ValidationResult`
    - URL-decode the `data` query parameter
    - Parse JSON and validate against RenderRequest structure
    - Validate userId is non-empty string
    - Validate data contains meta, books, and stats fields
    - Return specific error messages for each validation failure
  - [x] 2.4 Ensure validation tests pass
    - Run ONLY the 4-6 tests written in 2.1
    - Verify all error cases return descriptive messages
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 2.1 pass
- Valid requests parse correctly to RenderRequest type
- Invalid requests return specific error messages
- HTTP 400 returned before SSE stream starts for all validation failures

### Endpoint Implementation Layer

#### Task Group 3: GET /render-stream Endpoint
**Dependencies:** Task Groups 1, 2

- [x] 3.0 Complete endpoint implementation
  - [x] 3.1 Write 4-6 focused tests for /render-stream endpoint
    - Test valid request initiates SSE stream with correct headers
    - Test malformed request returns HTTP 400 JSON error (not SSE)
    - Test progress events emit on percentage changes
    - Test complete event includes filename and s3Url
    - Test error event emitted on render failure
  - [x] 3.2 Implement GET /render-stream endpoint in `server/index.ts`
    - Add route handler for GET /render-stream
    - Extract and validate `data` query parameter using validation utilities
    - Return HTTP 400 with JSON error body for invalid requests
    - Initialize SSE stream with proper headers for valid requests
  - [x] 3.3 Implement progress tracking with duplicate prevention
    - Create `lastEmittedProgress` variable to track last sent percentage
    - Emit progress only when current percentage differs from last emitted
    - Reset tracker at start of each request
  - [x] 3.4 Implement bundling phase with progress streaming
    - Call `bundle()` with onProgress callback
    - Map bundle progress (0-100) to overall progress (0-25) using `mapBundleProgress`
    - Emit progress events with phase: "bundling"
    - Reuse existing bundle configuration from POST /render
  - [x] 3.5 Implement rendering phase with progress streaming
    - Call `renderMedia()` with onProgress callback
    - Map render progress (0-1) to overall progress (25-100) using `mapRenderProgress`
    - Emit progress events with phase: "rendering"
    - Reuse existing renderMedia configuration from POST /render
  - [x] 3.6 Implement keepalive mechanism
    - Start 15-second interval timer after SSE headers sent
    - Send keepalive comment using `sendKeepalive`
    - Clear interval on completion or error
    - Use `setInterval` and `clearInterval`
  - [x] 3.7 Implement S3 upload and completion
    - Upload rendered file using existing `generateS3Key` and `uploadToS3`
    - Send complete event with filename and s3Url on success
    - Delete local file using `deleteLocalFile` after successful upload
    - Send error event if S3 upload fails (preserve local file)
  - [x] 3.8 Implement error handling
    - Wrap render pipeline in try-catch
    - Send error event with descriptive message on any failure
    - Clear keepalive interval on error
    - Close SSE connection after error event
  - [x] 3.9 Update server startup banner
    - Add GET /render-stream to endpoint list in console output
  - [x] 3.10 Ensure endpoint tests pass
    - Run ONLY the 4-6 tests written in 3.1
    - Verify SSE stream behavior is correct
    - Do NOT run the entire test suite at this stage

**Acceptance Criteria:**
- The 4-6 tests written in 3.1 pass
- GET /render-stream accepts URL-encoded JSON in `data` query param
- SSE headers: Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive
- Progress events emit on every percentage point (0-100)
- Two-phase progress: bundling (0-25%), rendering (25-100%)
- Complete event includes filename and s3Url
- Error events have descriptive messages
- Keepalive comments sent every 15 seconds
- HTTP 400 for malformed requests before SSE

### Testing

#### Task Group 4: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-3

- [x] 4.0 Review existing tests and fill critical gaps only
  - [x] 4.1 Review tests from Task Groups 1-3
    - Review the 4-6 tests written for SSE utilities (Task 1.1)
    - Review the 4-6 tests written for validation (Task 2.1)
    - Review the 4-6 tests written for endpoint (Task 3.1)
    - Total existing tests: approximately 12-18 tests
  - [x] 4.2 Analyze test coverage gaps for this feature only
    - Identify critical SSE workflows that lack test coverage
    - Focus ONLY on gaps related to render-stream endpoint requirements
    - Do NOT assess entire application test coverage
    - Prioritize end-to-end SSE streaming over unit test gaps
  - [x] 4.3 Write up to 8 additional strategic tests maximum
    - Add maximum of 8 new tests to fill identified critical gaps
    - Consider: keepalive timing, progress deduplication, phase transitions
    - Consider: S3 upload failure handling, connection cleanup
    - Do NOT write comprehensive coverage for all scenarios
    - Skip edge cases and performance tests unless business-critical
  - [x] 4.4 Run feature-specific tests only
    - Run ONLY tests related to this spec's feature (tests from 1.1, 2.1, 3.1, and 4.3)
    - Expected total: approximately 20-26 tests maximum
    - Do NOT run the entire application test suite
    - Verify critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 20-26 tests total)
- Critical SSE streaming workflows for this feature are covered
- No more than 8 additional tests added when filling in testing gaps
- Testing focused exclusively on render-stream endpoint requirements

## Execution Order

Recommended implementation sequence:

1. **SSE Infrastructure Layer (Task Group 1)**
   - Foundation for all SSE functionality
   - No dependencies on other groups
   - Creates reusable utilities for event formatting

2. **Request Validation Layer (Task Group 2)**
   - Depends on types but not SSE utilities
   - Critical for HTTP 400 handling before SSE
   - Enables proper request parsing

3. **Endpoint Implementation Layer (Task Group 3)**
   - Depends on Groups 1 and 2
   - Main feature implementation
   - Integrates all components

4. **Test Review and Gap Analysis (Task Group 4)**
   - Depends on Groups 1-3
   - Final quality assurance
   - Ensures feature completeness

## Key Implementation Notes

### Existing Code Reuse
- **POST /render**: Reuse bundling and renderMedia configuration patterns
- **server/lib/s3.ts**: Use `generateS3Key`, `uploadToS3`, `generatePublicUrl`
- **server/lib/cleanup.ts**: Use `deleteLocalFile` for local file cleanup
- **src/lib/types.ts**: Use `RenderRequest`, `MonthlyRecapExport` types
- **src/compositions/MonthlyRecap**: Use `calculateDuration` function

### SSE Format Reference
```
event: progress
data: {"progress": 15, "phase": "bundling"}

event: complete
data: {"filename": "recap-2026-01.mp4", "s3Url": "https://..."}

event: error
data: {"message": "Render failed: out of memory"}

: keepalive

```

### Progress Formula Reference
- Bundling: `Math.floor(bundleProgress * 0.25)` (maps 0-100 to 0-25)
- Rendering: `25 + Math.round(renderProgress * 75)` (maps 0-1 to 25-100)

## File Structure

New files to create:
- `server/lib/sse.ts` - SSE utilities and types
- `server/lib/validation.ts` - Query parameter validation
- `server/__tests__/sse.test.ts` - SSE utility tests
- `server/__tests__/validation.test.ts` - Validation tests
- `server/__tests__/render-stream.test.ts` - Endpoint tests

Files to modify:
- `server/index.ts` - Add GET /render-stream endpoint and update banner
