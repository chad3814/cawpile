import { S3Client } from '@aws-sdk/client-s3'

// Validate required environment variables
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_REGION = process.env.AWS_REGION || 'us-east-2'
export const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || 'cawpile-avatars'

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.warn('AWS credentials not configured. S3 operations will fail.')
}

/**
 * S3 client singleton for avatar uploads
 * Configured for the cawpile-avatars bucket
 */
export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
  requestChecksumCalculation: 'WHEN_REQUIRED', // Don't add checksums for presigned URLs
  responseChecksumValidation: 'WHEN_REQUIRED',
})

/**
 * Get the public URL for an S3 object
 */
export function getS3PublicUrl(key: string): string {
  return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`
}
