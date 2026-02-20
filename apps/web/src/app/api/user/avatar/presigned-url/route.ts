import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import {
  generatePresignedUploadUrl,
  isValidImageType,
  MAX_FILE_SIZE,
  VALID_IMAGE_TYPES,
} from '@/lib/s3-upload'

/**
 * POST /api/user/avatar/presigned-url
 * Generates a presigned URL for uploading an avatar to S3
 *
 * Request body: { contentType: string, fileSize: number }
 * Response: { presignedUrl: string, key: string, publicUrl: string }
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { contentType, fileSize } = body

    // Validate content type
    if (!contentType) {
      return NextResponse.json(
        { error: 'Content type is required' },
        { status: 400 }
      )
    }

    if (!isValidImageType(contentType)) {
      return NextResponse.json(
        {
          error: `Invalid content type. Allowed types: ${VALID_IMAGE_TYPES.join(', ')}`,
        },
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
        {
          error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
        },
        { status: 400 }
      )
    }

    // Generate presigned URL
    const { presignedUrl, key, publicUrl } = await generatePresignedUploadUrl(
      user.id,
      contentType
    )

    return NextResponse.json({
      presignedUrl,
      key,
      publicUrl,
    })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
