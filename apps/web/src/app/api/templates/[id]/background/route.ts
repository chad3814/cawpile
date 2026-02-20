import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { getCurrentUser } from '@/lib/auth/admin'
import prisma from '@/lib/prisma'
import { s3Client, AWS_S3_BUCKET, getS3PublicUrl } from '@/lib/s3'
import { deleteAvatar, extractKeyFromUrl } from '@/lib/s3-upload'

// Background image dimensions (video frame: 1080x1920 at 9:16)
const BACKGROUND_WIDTH = 1080
const BACKGROUND_HEIGHT = 1920

// Valid sequence values
const VALID_SEQUENCES = ['global', 'intro', 'bookReveal', 'statsReveal', 'comingSoon', 'outro'] as const

/**
 * POST /api/templates/[id]/background
 * Completes the background image upload by resizing and re-uploading
 *
 * Request body: { key: string, sequence: string }
 * Response: { backgroundUrl: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { key, sequence } = body

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'S3 key is required' }, { status: 400 })
    }

    if (!sequence || !VALID_SEQUENCES.includes(sequence)) {
      return NextResponse.json(
        { error: `Invalid sequence. Must be one of: ${VALID_SEQUENCES.join(', ')}` },
        { status: 400 }
      )
    }

    // Security check: key must be for this template
    if (!key.startsWith(`template-backgrounds/${id}/`)) {
      return NextResponse.json({ error: 'Invalid S3 key' }, { status: 403 })
    }

    // Verify template exists
    const template = await prisma.videoTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Download the original image from S3
    const getCommand = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
    })

    const response = await s3Client.send(getCommand)

    if (!response.Body) {
      throw new Error('Failed to download image from S3')
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    const s3Body = response.Body

    if ('getReader' in s3Body) {
      const reader = (s3Body as ReadableStream).getReader()
      let done = false
      while (!done) {
        const result = await reader.read()
        done = result.done
        if (result.value) {
          chunks.push(result.value)
        }
      }
    } else if (Symbol.asyncIterator in s3Body) {
      for await (const chunk of s3Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk)
      }
    } else {
      throw new Error('Unexpected body type from S3')
    }

    const originalBuffer = Buffer.concat(chunks)

    // Resize to 1080x1920 using sharp (cover fit, centered, JPEG quality 85)
    const resizedBuffer = await sharp(originalBuffer)
      .resize(BACKGROUND_WIDTH, BACKGROUND_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    // Generate new key for resized image
    const resizedKey = key.replace(/\.[^.]+$/, '-resized.jpg')

    // Upload the resized image
    const putCommand = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: resizedKey,
      Body: resizedBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'max-age=31536000',
    })

    await s3Client.send(putCommand)

    // Delete the original (non-resized) uploaded file (async, don't wait)
    deleteAvatar(key).catch((err) => {
      console.error('Failed to delete original background upload:', err)
    })

    const backgroundUrl = getS3PublicUrl(resizedKey)

    return NextResponse.json({ backgroundUrl })
  } catch (error) {
    console.error('Error processing template background:', error)
    return NextResponse.json(
      { error: 'Failed to process background image' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/templates/[id]/background
 * Removes a background image from S3 for a specific sequence
 *
 * Request body: { sequence: string }
 * Response: { success: true }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { sequence } = body

    if (!sequence || !VALID_SEQUENCES.includes(sequence)) {
      return NextResponse.json(
        { error: `Invalid sequence. Must be one of: ${VALID_SEQUENCES.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify template exists and get config
    const template = await prisma.videoTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Extract the background URL from the config
    const config = template.config as Record<string, unknown> | null
    let backgroundUrl: string | null = null

    if (config) {
      if (sequence === 'global') {
        const globalConfig = config.global as Record<string, unknown> | undefined
        backgroundUrl = (globalConfig?.backgroundImage as string) || null
      } else {
        const seqConfig = config[sequence] as Record<string, unknown> | undefined
        backgroundUrl = (seqConfig?.backgroundImage as string) || null
      }
    }

    // Delete the S3 object if URL exists
    if (backgroundUrl) {
      const s3Key = extractKeyFromUrl(backgroundUrl)
      if (s3Key) {
        deleteAvatar(s3Key).catch((err) => {
          console.error('Failed to delete background image from S3:', err)
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template background:', error)
    return NextResponse.json(
      { error: 'Failed to delete background image' },
      { status: 500 }
    )
  }
}
