import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { getCurrentUser } from '@/lib/auth/admin'
import prisma from '@/lib/prisma'
import { s3Client, AWS_S3_BUCKET, getS3PublicUrl } from '@/lib/s3'
import { MAX_FILE_SIZE, getExtensionFromContentType } from '@/lib/s3-upload'
import type { ValidImageType } from '@/lib/s3-upload'

// Valid image types for template backgrounds (no GIF)
const VALID_BACKGROUND_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const

type ValidBackgroundType = typeof VALID_BACKGROUND_TYPES[number]

// Valid sequence values
const VALID_SEQUENCES = ['global', 'intro', 'bookReveal', 'statsReveal', 'comingSoon', 'outro'] as const

// URL expiration time: 5 minutes
const PRESIGNED_URL_EXPIRATION = 60 * 5

function isValidBackgroundType(contentType: string): contentType is ValidBackgroundType {
  return VALID_BACKGROUND_TYPES.includes(contentType as ValidBackgroundType)
}

/**
 * POST /api/templates/[id]/background/presigned-url
 * Generates a presigned URL for uploading a template background image to S3
 *
 * Request body: { contentType: string, fileSize: number, sequence: string }
 * Response: { presignedUrl: string, key: string, publicUrl: string }
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
    const { contentType, fileSize, sequence } = body

    // Validate template exists
    const template = await prisma.videoTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Validate sequence
    if (!sequence || !VALID_SEQUENCES.includes(sequence)) {
      return NextResponse.json(
        { error: `Invalid sequence. Must be one of: ${VALID_SEQUENCES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate content type
    if (!contentType) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      )
    }

    if (!isValidBackgroundType(contentType)) {
      return NextResponse.json(
        { error: `Invalid content type. Allowed types: ${VALID_BACKGROUND_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (fileSize === undefined || fileSize === null) {
      return NextResponse.json(
        { error: 'File size is required' },
        { status: 400 }
      )
    }

    if (typeof fileSize !== 'number' || fileSize <= 0) {
      return NextResponse.json(
        { error: 'Invalid file size' },
        { status: 400 }
      )
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400 }
      )
    }

    // Generate S3 key: template-backgrounds/{templateId}/{sequence}-{timestamp}.{ext}
    const timestamp = Date.now()
    const ext = getExtensionFromContentType(contentType as ValidImageType)
    const key = `template-backgrounds/${id}/${sequence}-${timestamp}.${ext}`

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      ContentType: contentType,
    })

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRATION,
    })

    const publicUrl = getS3PublicUrl(key)

    return NextResponse.json({ presignedUrl, key, publicUrl })
  } catch (error) {
    console.error('Error generating presigned URL for template background:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
