import type { Response } from 'express'

/**
 * SSE phase values for progress tracking
 */
export type SSEPhase = 'bundling' | 'rendering'

/**
 * SSE progress event data
 */
export interface SSEProgressEvent {
  progress: number
  phase: SSEPhase
}

/**
 * SSE complete event data
 */
export interface SSECompleteEvent {
  filename: string
  s3Url: string
}

/**
 * SSE error event data
 */
export interface SSEErrorEvent {
  message: string
}

/**
 * Set up SSE response headers
 * Configures the response for Server-Sent Events streaming
 */
export function setupSSEHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  // Prevent proxy buffering (nginx, load balancers)
  res.setHeader('X-Accel-Buffering', 'no')

  // Disable Nagle's algorithm for immediate TCP packet transmission
  res.socket?.setNoDelay(true)

  // Disable response buffering for streaming
  res.flushHeaders()
}

/**
 * Flush the response to ensure immediate delivery
 * Forces TCP write and prevents buffering
 */
function flushResponse(res: Response): void {
  // Force flush by writing empty string to socket
  res.socket?.write('')
}

/**
 * Format and send an SSE event
 */
function sendEvent(res: Response, eventName: string, data: object): void {
  res.write(`event: ${eventName}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
  flushResponse(res)
}

/**
 * Send a progress event
 *
 * @param res - Express response object
 * @param progress - Current progress percentage (0-100)
 * @param phase - Current phase ("bundling" or "rendering")
 */
export function sendProgressEvent(res: Response, progress: number, phase: SSEPhase): void {
  const eventData: SSEProgressEvent = { progress, phase }
  sendEvent(res, 'progress', eventData)
}

/**
 * Send a complete event when render and S3 upload succeed
 *
 * @param res - Express response object
 * @param filename - The rendered video filename
 * @param s3Url - The S3 URL where the video is stored
 */
export function sendCompleteEvent(res: Response, filename: string, s3Url: string): void {
  const eventData: SSECompleteEvent = { filename, s3Url }
  sendEvent(res, 'complete', eventData)
}

/**
 * Send an error event when render or S3 upload fails
 *
 * @param res - Express response object
 * @param message - Descriptive error message
 */
export function sendErrorEvent(res: Response, message: string): void {
  const eventData: SSEErrorEvent = { message }
  sendEvent(res, 'error', eventData)
}

/**
 * Send a keepalive comment to prevent connection timeout
 *
 * @param res - Express response object
 */
export function sendKeepalive(res: Response): void {
  res.write(': keepalive\n\n')
  flushResponse(res)
}

/**
 * Map bundle progress (0-100) to overall progress (0-25)
 *
 * @param bundleProgress - Remotion bundle progress (0-100)
 * @returns Mapped progress value (0-25)
 */
export function mapBundleProgress(bundleProgress: number): number {
  return Math.floor(bundleProgress * 0.25)
}

/**
 * Map render progress (0-1) to overall progress (25-100)
 *
 * @param renderProgress - Remotion render progress (0-1)
 * @returns Mapped progress value (25-100)
 */
export function mapRenderProgress(renderProgress: number): number {
  return 25 + Math.round(renderProgress * 75)
}
