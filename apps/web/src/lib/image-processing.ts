import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client, AWS_S3_BUCKET, getS3PublicUrl } from './s3'
import sharp from 'sharp'

// Avatar dimensions after resize
const AVATAR_SIZE = 200

/**
 * Download, resize, and re-upload an avatar image
 * Resizes to 200x200 pixels maintaining aspect ratio (cover fit)
 *
 * @param s3Key - The S3 key of the uploaded image
 * @returns The public URL of the resized image
 */
export async function resizeAvatar(s3Key: string): Promise<string> {
  // Download the original image from S3
  const getCommand = new GetObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: s3Key,
  })

  const response = await s3Client.send(getCommand)

  if (!response.Body) {
    throw new Error('Failed to download image from S3')
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = []
  const body = response.Body

  // Handle Web ReadableStream
  if ('getReader' in body) {
    const reader = body.getReader()
    let done = false
    while (!done) {
      const result = await reader.read()
      done = result.done
      if (result.value) {
        chunks.push(result.value)
      }
    }
  } else if (Symbol.asyncIterator in body) {
    // Handle Node.js Readable stream
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
  } else {
    throw new Error('Unexpected body type from S3')
  }

  const originalBuffer = Buffer.concat(chunks)

  // Resize the image using sharp
  const resizedBuffer = await sharp(originalBuffer)
    .resize(AVATAR_SIZE, AVATAR_SIZE, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 85 }) // Convert to JPEG for consistency and smaller size
    .toBuffer()

  // Generate new key for resized image
  const resizedKey = s3Key.replace(/\.[^.]+$/, '-resized.jpg')

  // Upload the resized image
  const putCommand = new PutObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: resizedKey,
    Body: resizedBuffer,
    ContentType: 'image/jpeg',
    CacheControl: 'max-age=31536000', // Cache for 1 year
  })

  await s3Client.send(putCommand)

  // Return the public URL of the resized image
  return getS3PublicUrl(resizedKey)
}

/**
 * Validate image dimensions and size from a buffer
 * @param buffer - The image buffer
 * @returns Object with validation results
 */
export async function validateImage(buffer: Buffer): Promise<{
  valid: boolean
  width?: number
  height?: number
  format?: string
  error?: string
}> {
  try {
    const metadata = await sharp(buffer).metadata()

    return {
      valid: true,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to process image',
    }
  }
}
