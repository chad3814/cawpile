import express from 'express'
import cors from 'cors'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import path from 'path'
import fs from 'fs'
import type { RenderRequest } from '../src/lib/types'
import type { VideoTemplate } from '../src/lib/template-types'
import { calculateDuration } from '../src/compositions/MonthlyRecap'
import { VIDEO_CONFIG } from '../src/lib/theme'
import { validateAwsEnv } from './lib/validateEnv'
import { generateS3Key, uploadToS3 } from './lib/s3'
import { deleteLocalFile } from './lib/cleanup'
import { parseRenderStreamQuery } from './lib/validation'
import { validateTemplate } from './lib/template-validation'
import {
  setupSSEHeaders,
  sendProgressEvent,
  sendCompleteEvent,
  sendErrorEvent,
  sendKeepalive,
  mapBundleProgress,
  mapRenderProgress,
} from './lib/sse'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Output directory
const OUTPUT_DIR = path.join(process.cwd(), 'out')
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Render stream endpoint with SSE progress
app.get('/render-stream', async (req, res) => {
  // Validate query parameters before initiating SSE
  const queryData = req.query.data as string | undefined
  const queryUserId = req.query.userId as string | undefined
  const queryTemplate = req.query.template as string | undefined
  const validationResult = parseRenderStreamQuery(queryData, queryUserId, queryTemplate)

  if (!validationResult.valid) {
    return res.status(400).json({ error: validationResult.error })
  }

  const { userId, data, template } = validationResult.data

  // Set up SSE headers
  setupSSEHeaders(res)

  // Progress tracking for duplicate prevention
  let lastEmittedProgress = -1

  // Keepalive mechanism
  const keepaliveInterval = setInterval(() => {
    sendKeepalive(res)
  }, 15000)

  // Helper to emit progress only on change
  const emitProgress = (progress: number, phase: 'bundling' | 'rendering') => {
    if (progress !== lastEmittedProgress) {
      sendProgressEvent(res, progress, phase)
      lastEmittedProgress = progress
    }
  }

  try {
    console.log(
      `[Render-Stream] Starting render for ${data.meta.monthName} ${data.meta.year} (${data.books.length} books)`
    )
    if (template) {
      console.log('[Render-Stream] Using custom template')
    }

    // Calculate duration based on content and template
    const durationInFrames = calculateDuration(data, template)
    console.log(
      `[Render-Stream] Duration: ${durationInFrames} frames (${(durationInFrames / VIDEO_CONFIG.fps).toFixed(1)}s)`
    )

    // Bundle the project with progress streaming
    console.log('[Render-Stream] Bundling...')
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'src/index.ts'),
      onProgress: (progress) => {
        const mappedProgress = mapBundleProgress(progress)
        emitProgress(mappedProgress, 'bundling')
      },
    })

    // Input props with template
    const inputProps = template ? { data, template } : { data }

    // Select composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MonthlyRecap',
      inputProps,
    })

    // Override duration with calculated value
    composition.durationInFrames = durationInFrames

    // Generate output filename
    const filename = `recap-${data.meta.year}-${String(data.meta.month).padStart(2, '0')}-${Date.now()}.mp4`
    const outputPath = path.join(OUTPUT_DIR, filename)

    // Render the video with progress streaming
    console.log('[Render-Stream] Rendering video...')
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      onProgress: ({ progress }) => {
        const mappedProgress = mapRenderProgress(progress)
        emitProgress(mappedProgress, 'rendering')
      },
    })

    console.log(`[Render-Stream] Render complete: ${outputPath}`)

    // Upload to S3 immediately after render completes
    const s3Key = generateS3Key({
      userId,
      year: data.meta.year,
      month: data.meta.month,
      timestamp: new Date(),
    })

    try {
      const uploadResult = await uploadToS3({
        filePath: outputPath,
        key: s3Key,
      })

      // Delete local file only after successful S3 upload
      await deleteLocalFile(outputPath)
      console.log(`[Render-Stream] Local file deleted: ${filename}`)

      // Clear keepalive and send complete event
      clearInterval(keepaliveInterval)
      sendCompleteEvent(res, filename, uploadResult.url)
      res.end()
    } catch (s3Error) {
      // S3 upload failed - do NOT delete local file
      console.error('[Render-Stream] S3 upload failed, preserving local file:', s3Error)
      clearInterval(keepaliveInterval)
      sendErrorEvent(res, `S3 upload failed: ${s3Error instanceof Error ? s3Error.message : 'Unknown S3 error'}`)
      res.end()
    }
  } catch (error) {
    console.error('[Render-Stream] Error:', error)
    clearInterval(keepaliveInterval)
    sendErrorEvent(res, `Render failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    res.end()
  }
})

// Render endpoint
app.post('/render', async (req, res) => {
  const startTime = Date.now()

  try {
    const requestBody: RenderRequest = req.body

    // Validate userId
    if (!requestBody.userId || typeof requestBody.userId !== 'string' || requestBody.userId.trim() === '') {
      return res.status(400).json({
        error: 'Invalid request body. userId is required and must be a non-empty string.',
      })
    }

    const { userId, data, template: rawTemplate } = requestBody

    // Validate input
    if (!data || !data.meta || !data.books || !data.stats) {
      return res.status(400).json({
        error: 'Invalid request body. Expected MonthlyRecapExport format in data field.',
      })
    }

    // Validate and sanitize template if provided
    let template: Partial<VideoTemplate> | undefined
    if (rawTemplate) {
      const templateValidation = validateTemplate(rawTemplate)
      if (templateValidation.warnings.length > 0) {
        console.log(`[Render] Template validation warnings: ${templateValidation.warnings.join(', ')}`)
      }
      // Use the raw template (not sanitized) since the composition will handle merging
      template = rawTemplate
    }

    console.log(
      `[Render] Starting render for ${data.meta.monthName} ${data.meta.year} (${data.books.length} books)`
    )
    if (template) {
      console.log('[Render] Using custom template')
    }

    // Calculate duration based on content and template
    const durationInFrames = calculateDuration(data, template)
    console.log(`[Render] Duration: ${durationInFrames} frames (${(durationInFrames / VIDEO_CONFIG.fps).toFixed(1)}s)`)

    // Bundle the project
    console.log('[Render] Bundling...')
    const bundleLocation = await bundle({
      entryPoint: path.join(process.cwd(), 'src/index.ts'),
      onProgress: (progress) => {
        if (progress % 25 === 0) {
          console.log(`[Render] Bundle progress: ${progress}%`)
        }
      },
    })

    // Input props with template
    const inputProps = template ? { data, template } : { data }

    // Select composition
    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MonthlyRecap',
      inputProps,
    })

    // Override duration with calculated value
    composition.durationInFrames = durationInFrames

    // Generate output filename
    const filename = `recap-${data.meta.year}-${String(data.meta.month).padStart(2, '0')}-${Date.now()}.mp4`
    const outputPath = path.join(OUTPUT_DIR, filename)

    // Render the video
    console.log('[Render] Rendering video...')
    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 10 === 0) {
          console.log(`[Render] Render progress: ${Math.round(progress * 100)}%`)
        }
      },
    })

    const renderElapsedTime = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[Render] Complete! Rendered in ${renderElapsedTime}s: ${outputPath}`)

    // Upload to S3 immediately after render completes
    const s3Key = generateS3Key({
      userId,
      year: data.meta.year,
      month: data.meta.month,
      timestamp: new Date(),
    })

    let s3Url: string
    try {
      const uploadResult = await uploadToS3({
        filePath: outputPath,
        key: s3Key,
      })
      s3Url = uploadResult.url

      // Delete local file only after successful S3 upload
      await deleteLocalFile(outputPath)
      console.log(`[Render] Local file deleted: ${filename}`)
    } catch (s3Error) {
      // S3 upload failed - do NOT delete local file
      console.error('[S3] Upload failed, preserving local file:', s3Error)
      return res.status(500).json({
        error: 'S3 upload failed',
        message: s3Error instanceof Error ? s3Error.message : 'Unknown S3 error',
      })
    }

    const totalElapsedTime = ((Date.now() - startTime) / 1000).toFixed(1)

    // Return success with S3 URL
    res.json({
      success: true,
      filename,
      s3Url,
      duration: durationInFrames / VIDEO_CONFIG.fps,
      renderTime: totalElapsedTime,
    })
  } catch (error) {
    console.error('[Render] Error:', error)
    res.status(500).json({
      error: 'Render failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Download endpoint
app.get('/download/:filename', (req, res) => {
  const { filename } = req.params
  const filePath = path.join(OUTPUT_DIR, filename)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }

  res.download(filePath)
})

// List rendered videos
app.get('/videos', (req, res) => {
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.mp4'))
  const videos = files.map((filename) => {
    const filePath = path.join(OUTPUT_DIR, filename)
    const stats = fs.statSync(filePath)
    return {
      filename,
      size: stats.size,
      created: stats.birthtime,
    }
  })
  res.json({ videos })
})

// Validate environment variables and start server
try {
  validateAwsEnv()
  console.log('[Server] AWS environment variables validated successfully')
} catch (error) {
  console.error('[Server] Environment validation failed:', error instanceof Error ? error.message : error)
  process.exit(1)
}

// Export app for testing
export { app }

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║  Cawpile Video Generator Server                       ║
║  ─────────────────────────────────────────────────── ║
║  Listening on http://localhost:${PORT}                   ║
║                                                       ║
║  Endpoints:                                           ║
║    POST /render        - Render video from recap data ║
║    GET  /render-stream - Stream render progress (SSE) ║
║    GET  /download/:filename - Download rendered video ║
║    GET  /videos        - List rendered videos         ║
║    GET  /health        - Health check                 ║
╚═══════════════════════════════════════════════════════╝
  `)
})
