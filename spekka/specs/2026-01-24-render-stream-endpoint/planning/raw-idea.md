# Raw Idea: Render Stream Endpoint

## Feature Description

Create the /render-stream endpoint for SSE progress streaming during Remotion video renders

## Details from render-server-changes.md

- New GET /render-stream endpoint that accepts recap data as URL-encoded JSON query parameter
- Streams progress via Server-Sent Events (SSE) with three event types:
  - progress events with percentage (0-100)
  - complete events with filename
  - error events with message
- Uses Remotion's renderMedia onProgress callback
- Requires proper SSE headers

## Source

Feature description provided by user based on render-server-changes.md documentation.
