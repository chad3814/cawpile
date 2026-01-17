import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client, AWS_S3_BUCKET, getS3PublicUrl } from './s3'

// Valid image content types
export const VALID_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
] as const

export type ValidImageType = typeof VALID_IMAGE_TYPES[number]

// Max file size: 5MB
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

// URL expiration time: 5 minutes
const PRESIGNED_URL_EXPIRATION = 60 * 5

/**
 * Validate image content type
 */
export function isValidImageType(contentType: string): contentType is ValidImageType {
  return VALID_IMAGE_TYPES.includes(contentType as ValidImageType)
}

/**
 * Get file extension from content type
 */
export function getExtensionFromContentType(contentType: ValidImageType): string {
  const extensionMap: Record<ValidImageType, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  }
  return extensionMap[contentType]
}

/**
 * Generate a unique S3 key for avatar uploads
 * Pattern: avatars/{userId}/{timestamp}-{uuid}.{ext}
 */
export function generateAvatarKey(userId: string, contentType: ValidImageType): string {
  const timestamp = Date.now()
  const uuid = crypto.randomUUID()
  const ext = getExtensionFromContentType(contentType)
  return `avatars/${userId}/${timestamp}-${uuid}.${ext}`
}

/**
 * Generate a presigned URL for uploading an avatar
 * @param userId - The user's ID
 * @param contentType - The image content type
 * @returns Object containing presigned URL and the S3 key
 */
export async function generatePresignedUploadUrl(
  userId: string,
  contentType: string
): Promise<{ presignedUrl: string; key: string; publicUrl: string }> {
  if (!isValidImageType(contentType)) {
    throw new Error(`Invalid content type: ${contentType}. Allowed types: ${VALID_IMAGE_TYPES.join(', ')}`)
  }

  const key = generateAvatarKey(userId, contentType)

  const command = new PutObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRATION,
  })

  const publicUrl = getS3PublicUrl(key)

  return { presignedUrl, key, publicUrl }
}

/**
 * Delete an avatar from S3
 * @param key - The S3 key of the avatar to delete
 */
export async function deleteAvatar(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: key,
  })

  await s3Client.send(command)
}

/**
 * Extract S3 key from a public URL
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    // Remove leading slash from pathname
    return urlObj.pathname.slice(1)
  } catch {
    return null
  }
}
