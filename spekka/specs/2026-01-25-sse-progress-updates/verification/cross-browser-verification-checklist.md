# Cross-Browser SSE Verification Checklist

## Purpose
Manual verification steps to confirm SSE progress updates work correctly across all major browsers and deployment environments.

## Prerequisites
- Server running (local or Docker)
- Access to browser developer tools
- Test video render payload ready

## Test Steps

### 1. Firefox Verification
- [ ] Open Firefox and navigate to application
- [ ] Open Developer Tools (F12) -> Network tab
- [ ] Filter by "EventStream" or XHR
- [ ] Trigger a video render operation
- [ ] Verify progress events appear in real-time (within 100ms)
- [ ] Verify progress values increment smoothly (0 -> 25 during bundling, 25 -> 100 during rendering)
- [ ] Verify complete event is received with filename and s3Url
- [ ] Check no events are batched at the end

### 2. Chrome Verification
- [ ] Open Chrome and navigate to application
- [ ] Open Developer Tools (F12) -> Network tab
- [ ] Filter by "EventStream"
- [ ] Trigger a video render operation
- [ ] Verify progress events appear in real-time (within 100ms)
- [ ] Verify event format: `event: progress` followed by `data: {"progress":X,"phase":"Y"}`
- [ ] Verify complete event is received
- [ ] Check Network tab shows Response Headers include:
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
  - `X-Accel-Buffering: no`

### 3. Safari Verification (macOS)
- [ ] Open Safari and navigate to application
- [ ] Enable Develop menu (Preferences -> Advanced -> Show Develop menu)
- [ ] Open Web Inspector -> Network tab
- [ ] Trigger a video render operation
- [ ] Verify progress events appear in real-time
- [ ] Verify complete or error event terminates the stream properly

### 4. Edge Verification
- [ ] Open Microsoft Edge and navigate to application
- [ ] Open Developer Tools (F12) -> Network tab
- [ ] Filter by "EventStream"
- [ ] Trigger a video render operation
- [ ] Verify progress events appear in real-time
- [ ] Verify event handling matches Chrome behavior

### 5. Docker Environment Verification
- [ ] Build and run the Docker container
- [ ] Repeat Firefox verification steps against containerized server
- [ ] Verify no additional buffering is introduced by Docker networking
- [ ] If behind nginx proxy, verify X-Accel-Buffering header prevents proxy buffering

## Expected Behavior

### Real-Time Delivery
- Progress events should appear within 100ms of being sent by server
- Events should NOT batch together at the end of the stream
- Keepalive comments should be sent every 15 seconds

### Event Format
```
event: progress
data: {"progress":15,"phase":"bundling"}

event: progress
data: {"progress":50,"phase":"rendering"}

event: complete
data: {"filename":"video.mp4","s3Url":"https://..."}
```

### Response Headers
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

## Technical Requirements Verification

| Requirement | Implementation | Verified |
|------------|----------------|----------|
| TR1: Flush after sendEvent writes | `res.socket?.write('')` called after write | [ ] |
| TR2: Flush after sendKeepalive writes | `res.socket?.write('')` called after write | [ ] |
| TR3: X-Accel-Buffering header | `res.setHeader('X-Accel-Buffering', 'no')` | [ ] |
| TR4: Disable Nagle's algorithm | `res.socket?.setNoDelay(true)` | [ ] |
| TR5: Tests verify flush behavior | 24 tests pass including flush tests | [ ] |

## Troubleshooting

### Events Still Batched
1. Check server logs for write errors
2. Verify flush is being called (add logging temporarily)
3. Check for compression middleware that may buffer responses
4. Ensure client EventSource is properly configured

### Firefox-Specific Issues
1. Check browser console for EventSource errors
2. Verify connection count (Firefox limit: 6 per domain)
3. Try in private/incognito mode to rule out extensions

### Docker/Proxy Issues
1. Verify X-Accel-Buffering header is present in response
2. Check proxy configuration for buffering settings
3. Test direct container access (bypass proxy) to isolate issue
