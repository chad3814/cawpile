# Render Server Changes (Remotion Project)

This document describes the changes needed in the separate Remotion render server project to support SSE progress streaming.

## New Endpoint: GET /render-stream

### Request Format
- Method: GET (required for SSE/EventSource)
- Query parameter: `data` containing URL-encoded JSON recap data
- Example: `GET /render-stream?data=%7B%22monthName%22%3A%22January%22...%7D`

### SSE Event Types

**Progress Event**
```
event: progress
data: {"progress": 45}
```
- Emit periodically during render (e.g., per frame or per percentage point)
- `progress` is an integer 0-100

**Complete Event**
```
event: complete
data: {"filename": "recap-2026-01.mp4"}
```
- Emit once when render finishes successfully
- `filename` is the file available at `/download/{filename}`

**Error Event**
```
event: error
data: {"message": "Render failed: out of memory"}
```
- Emit if render fails for any reason
- `message` contains human-readable error description

### Response Headers
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Implementation Notes

**Remotion Progress Hook**
- Remotion's `renderMedia` accepts an `onProgress` callback
- Callback receives `{ progress: number }` where progress is 0-1
- Multiply by 100 and round for percentage

**Express Example Structure**
```javascript
app.get('/render-stream', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Parse data from query
  const data = JSON.parse(decodeURIComponent(req.query.data));

  // Render with progress callback
  await renderMedia({
    // ... existing config
    onProgress: ({ progress }) => {
      res.write(`event: progress\ndata: ${JSON.stringify({ progress: Math.round(progress * 100) })}\n\n`);
    }
  });

  // Send complete event
  res.write(`event: complete\ndata: ${JSON.stringify({ filename })}\n\n`);
  res.end();
});
```

**Keep-Alive Consideration**
- Some proxies may close idle connections
- Consider sending a comment line (`: keepalive`) every 15 seconds if needed
- Not required for localhost development

## Existing Endpoint: POST /render

Keep the existing POST endpoint functional for backwards compatibility or non-streaming clients. No changes required to the existing endpoint.

## Existing Endpoint: GET /download/:filename

No changes required. Continue serving rendered files from this endpoint.
