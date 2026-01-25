# Specification: Video Render Progress Messages

## Goal
Add real-time progress display during video rendering in the MonthlyRecapModal by replacing the current fetch-based render call with SSE streaming from the render server.

## User Stories
- As a user generating a video recap, I want to see rendering progress so I know the operation is working and how far along it is
- As a user, I want immediate error feedback if the render connection fails so I can retry manually

## Specific Requirements

**SSE Connection to Render Server**
- Replace the POST fetch to `http://localhost:3001/render` with an EventSource connection
- Connect to a new SSE endpoint: `http://localhost:3001/render-stream`
- Send recap data as URL-encoded JSON in query parameter (data is small, under 2KB typically)
- Close the EventSource connection when render completes or errors

**Progress State Management**
- Add `renderProgress` state (number, 0-100) to track current percentage
- Update progress state when SSE `progress` events are received
- Reset progress to 0 when starting a new render or when modal closes
- Parse progress events expecting format: `{ progress: number }`

**Progress Bar UI Component**
- Display progress bar only during `rendering` status (replaces current spinner)
- Use existing progress bar pattern from BookCard: outer `bg-border` container, inner `bg-primary` fill
- Show percentage text above bar aligned right (e.g., "45%")
- Keep the existing blue info-box styling for the container

**Completion Handling**
- Listen for SSE `complete` event containing `{ filename: string }`
- Trigger download using the filename from the complete event
- Close EventSource connection after receiving complete event
- Transition to `success` status after download initiates

**Error Handling**
- Listen for SSE `error` events from the server
- Handle EventSource `onerror` for connection drops
- Set error message and transition to `error` status immediately on any failure
- No reconnection attempts - user can retry manually via the button
- Close EventSource connection on error

**Cleanup on Modal Close**
- Close any active EventSource connection when modal closes
- Reset renderProgress state to 0
- Ensure no memory leaks from orphaned event listeners

## Existing Code to Leverage

**Progress Bar Pattern in BookCard**
- Located at `src/components/dashboard/BookCard.tsx` lines 436-448
- Uses `bg-border rounded-full h-2` for container
- Uses `bg-primary h-2 rounded-full transition-all` for fill bar
- Dynamic width via inline style: `style={{ width: \`${progress}%\` }}`
- Percentage display uses `text-xs text-muted-foreground`

**MonthlyRecapModal Structure**
- Located at `src/components/modals/MonthlyRecapModal.tsx`
- Current render logic in `handleGenerateVideo` function (lines 119-170)
- Status rendering section at lines 308-331
- Uses Headless UI Dialog with Transition for modal pattern
- Already has `renderStatus` state that controls UI display

**Error Display Pattern**
- Current error box at lines 327-330: red background with `bg-red-50 dark:bg-red-900/20`
- Error text styling: `text-sm text-red-800 dark:text-red-200`
- Reuse this exact pattern for SSE errors

**State Reset Pattern**
- Existing cleanup in useEffect when modal closes (lines 74-80)
- Add progress reset and EventSource cleanup to this same effect

## Out of Scope
- Cancellation functionality (no cancel button or abort logic)
- Reconnection or retry logic (user manually retries via button)
- Detailed phase breakdowns or step indicators
- Estimated time remaining calculations
- Server-side render server implementation (documented separately)
- Animated progress bar transitions beyond TailwindCSS transition-all
- Progress persistence across modal open/close cycles
- Multiple concurrent render support
- Progress history or logging
- Audio/visual notifications on completion
