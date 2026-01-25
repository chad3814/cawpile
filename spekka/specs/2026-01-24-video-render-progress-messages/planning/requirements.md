# Requirements: Video Render Progress Messages

## Feature Summary
Add real-time progress messages from the video render server to display in the MonthlyRecapModal during video generation.

## User Answers

### 1. Render Server Ownership
- The render server at `localhost:3001` is a separate Remotion-based project under user's control
- Both client-side (this codebase) and server-side changes can be made

### 2. Communication Protocol
- **SSE (Server-Sent Events) streaming**
- Real-time, one-way communication from render server to client

### 3. Progress Display
- **Numeric progress with a progress bar**
- Show percentage completion (e.g., "45%")
- Visual progress bar to indicate rendering status

### 4. Render Server Documentation
- Render server changes should be **documented separately** in a markdown file
- Not included in the main spec, but provided as implementation notes

### 5. UI Approach
- **KISS (Keep It Simple)**
- Compact design
- Progress bar + percentage/message text
- No elaborate phase icons or estimated time remaining

### 6. Error Handling
- **Show error immediately** if connection drops mid-render
- No reconnection attempts or resume logic
- User can retry manually if needed

### 7. Scope Constraints
- Do exactly what is stated above
- No additional features beyond progress display
- No cancellation functionality
- No detailed phase breakdowns

## Technical Context (from codebase exploration)

### Current Implementation
- Modal: `src/components/dashboard/MonthlyRecapModal.tsx`
- Render endpoint: `POST http://localhost:3001/render`
- Download endpoint: `http://localhost:3001/download/{filename}`
- Current status states: `'idle' | 'loading' | 'rendering' | 'success' | 'error'`
- Currently shows generic "Generating video..." spinner during rendering

### Required Changes (This Codebase)
1. Update `MonthlyRecapModal` to use SSE instead of simple fetch for rendering
2. Add progress bar component to modal
3. Display numeric progress percentage
4. Handle SSE connection errors immediately

### Required Changes (Render Server - Separate Doc)
1. Implement SSE endpoint for progress streaming
2. Emit progress events during Remotion render
3. Include percentage in progress events

## Visual Assets
None provided.
