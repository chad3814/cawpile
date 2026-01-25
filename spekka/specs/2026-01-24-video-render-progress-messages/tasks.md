# Task Breakdown: Video Render Progress Messages

## Overview
Total Tasks: 14

This feature replaces the current fetch-based video render call in MonthlyRecapModal with SSE streaming, displaying real-time progress to the user during video generation.

**Note**: Render server changes are documented separately in `planning/render-server-changes.md`. The user will implement those changes in the separate Remotion project. This task list focuses exclusively on changes to the Next.js application.

## Task List

### Frontend Layer

#### Task Group 1: SSE Connection Infrastructure
**Dependencies:** None (render server SSE endpoint must be implemented separately)

- [x] 1.0 Complete SSE connection infrastructure
  - [x] 1.1 Write 3 focused tests for SSE connection behavior
    - Test EventSource connection is established with correct URL and encoded data
    - Test EventSource connection is closed on modal close
    - Test EventSource connection is closed on successful completion
  - [x] 1.2 Add `renderProgress` state to MonthlyRecapModal
    - Type: `number` initialized to 0
    - Add alongside existing `renderStatus` state at line 35
  - [x] 1.3 Create SSE connection in `handleGenerateVideo` function
    - Build URL: `http://localhost:3001/render-stream?data=${encodedData}`
    - Use `encodeURIComponent(JSON.stringify(data))` for the query parameter
    - Create EventSource instance and store in ref for cleanup access
    - Replace current POST fetch logic (lines 139-151)
  - [x] 1.4 Add EventSource ref for cleanup access
    - Create ref: `const eventSourceRef = useRef<EventSource | null>(null)`
    - Store EventSource instance in ref when created
    - Use ref for cleanup in modal close effect
  - [x] 1.5 Ensure SSE connection tests pass
    - Run ONLY the 3 tests written in 1.1
    - Verify connection is established correctly

**Acceptance Criteria:**
- EventSource connects to `/render-stream` with encoded recap data
- EventSource ref is available for cleanup
- Connection replaces the previous POST fetch approach

---

#### Task Group 2: SSE Event Handling
**Dependencies:** Task Group 1

- [x] 2.0 Complete SSE event handling
  - [x] 2.1 Write 4 focused tests for SSE event handling
    - Test progress event updates `renderProgress` state correctly
    - Test complete event triggers download and sets success status
    - Test error event from server sets error state and error status
    - Test connection drop (onerror) sets error state and error status
  - [x] 2.2 Implement progress event handler
    - Listen for `progress` event type on EventSource
    - Parse event data expecting `{ progress: number }`
    - Update `renderProgress` state with received value
  - [x] 2.3 Implement complete event handler
    - Listen for `complete` event type on EventSource
    - Parse event data expecting `{ filename: string }`
    - Trigger download using existing download pattern (lines 154-160)
    - Close EventSource connection
    - Set `renderStatus` to `'success'`
  - [x] 2.4 Implement error event handler
    - Listen for `error` event type from server (SSE error event)
    - Parse event data expecting `{ message: string }`
    - Set `error` state with message
    - Set `renderStatus` to `'error'`
    - Close EventSource connection
  - [x] 2.5 Implement connection error handler (onerror)
    - Handle EventSource `onerror` event for connection drops
    - Set generic error message: "Connection to render server lost"
    - Set `renderStatus` to `'error'`
    - Close EventSource connection
  - [x] 2.6 Ensure SSE event handling tests pass
    - Run ONLY the 4 tests written in 2.1
    - Verify all event types are handled correctly

**Acceptance Criteria:**
- Progress events update the progress state (0-100)
- Complete event triggers download and closes connection
- Server error events display the error message
- Connection drops show appropriate error message
- All event handlers close the EventSource connection appropriately

---

#### Task Group 3: Progress Bar UI
**Dependencies:** Task Group 2

- [x] 3.0 Complete progress bar UI
  - [x] 3.1 Write 3 focused tests for progress bar UI
    - Test progress bar displays during `rendering` status
    - Test progress bar width reflects `renderProgress` value
    - Test percentage text displays correct value
  - [x] 3.2 Replace spinner with progress bar in rendering status block
    - Modify the rendering status section (lines 308-316)
    - Keep the blue info-box container styling
    - Remove the spinner div
  - [x] 3.3 Add progress bar following BookCard pattern
    - Container: `bg-border rounded-full h-2`
    - Fill bar: `bg-primary h-2 rounded-full transition-all`
    - Dynamic width: `style={{ width: \`${renderProgress}%\` }}`
  - [x] 3.4 Add percentage text display
    - Position above progress bar, aligned right
    - Use styling: `text-xs text-muted-foreground`
    - Display format: `${renderProgress}%`
  - [x] 3.5 Update status message text
    - Change "Generating video..." to include progress context
    - Example: "Generating video..." with percentage shown separately
  - [x] 3.6 Ensure progress bar UI tests pass
    - Run ONLY the 3 tests written in 3.1
    - Verify progress bar renders and updates correctly

**Acceptance Criteria:**
- Progress bar displays instead of spinner during rendering
- Progress bar width updates dynamically with progress state
- Percentage text shows current progress value
- Blue info-box container styling is preserved

---

#### Task Group 4: Cleanup and State Reset
**Dependencies:** Task Groups 1-3

- [x] 4.0 Complete cleanup and state reset logic
  - [x] 4.1 Write 2 focused tests for cleanup behavior
    - Test EventSource is closed when modal closes during rendering
    - Test renderProgress resets to 0 when modal closes
  - [x] 4.2 Add EventSource cleanup to modal close effect
    - Extend existing useEffect (lines 74-80)
    - Close EventSource if connection is active: `eventSourceRef.current?.close()`
    - Set ref to null after closing
  - [x] 4.3 Add renderProgress reset to modal close effect
    - Add `setRenderProgress(0)` to the cleanup effect
    - Ensure progress resets alongside other state resets
  - [x] 4.4 Ensure cleanup tests pass
    - Run ONLY the 2 tests written in 4.1
    - Verify no memory leaks from orphaned connections

**Acceptance Criteria:**
- Active EventSource connection is closed when modal closes
- Progress state resets to 0 on modal close
- No memory leaks from orphaned event listeners

---

### Testing

#### Task Group 5: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-4

- [x] 5.0 Review existing tests and fill critical gaps only
  - [x] 5.1 Review tests from Task Groups 1-4
    - Review the 3 SSE connection tests (Task 1.1)
    - Review the 4 SSE event handling tests (Task 2.1)
    - Review the 3 progress bar UI tests (Task 3.1)
    - Review the 2 cleanup tests (Task 4.1)
    - Total existing tests: 12 tests
  - [x] 5.2 Analyze test coverage gaps for this feature only
    - Identify any critical integration scenarios not covered
    - Focus on end-to-end flow: start render -> progress updates -> completion
    - Do NOT assess entire application test coverage
  - [x] 5.3 Write up to 5 additional strategic tests if necessary
    - Add maximum of 5 new tests to fill identified critical gaps
    - Consider: full render flow integration, edge cases like rapid progress updates
    - Skip: performance tests, accessibility tests, error recovery variations
  - [x] 5.4 Run feature-specific tests only
    - Run ONLY tests related to this feature (tests from 1.1, 2.1, 3.1, 4.1, and 5.3)
    - Expected total: approximately 12-17 tests maximum
    - Verify critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 12-17 tests total)
- Critical user workflows for video render progress are covered
- No more than 5 additional tests added when filling gaps
- Testing focused exclusively on this feature's requirements

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: SSE Connection Infrastructure** - Foundation for SSE communication
2. **Task Group 2: SSE Event Handling** - Process all server events
3. **Task Group 3: Progress Bar UI** - Visual display of progress
4. **Task Group 4: Cleanup and State Reset** - Proper resource management
5. **Task Group 5: Test Review and Gap Analysis** - Validate complete implementation

## Files Modified

| File | Changes |
|------|---------|
| `src/components/modals/MonthlyRecapModal.tsx` | Add SSE logic, progress state, progress bar UI, cleanup |
| `__tests__/components/modals/MonthlyRecapModal.test.tsx` | New test file for feature tests |

## Dependencies on External Work

The render server must implement the SSE endpoint (`GET /render-stream`) as documented in `planning/render-server-changes.md` before this feature can be fully tested end-to-end. Development and unit testing can proceed with mocked EventSource responses.
