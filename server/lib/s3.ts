import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs/promises'

/**
 * S3 configuration from environment variables
 * Note: These are read at module load time, but the S3 client is created lazily
 */
export function getS3Config() {
  return {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || '',
    bucketName: process.env.S3_BUCKET_NAME || '',
  }
}

// Legacy export for backward compatibility
export const S3_CONFIG = getS3Config()

/**
 * S3 Client instance - initialized lazily when first needed
 */
let s3ClientInstance: S3Client | null = null

export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const config = getS3Config()
    s3ClientInstance = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }
  return s3ClientInstance
}

/**
 * Reset the S3 client singleton - primarily for testing purposes
 */
export function resetS3Client(): void {
  s3ClientInstance = null
}

/**
 * Parameters for generating an S3 object key
 */
export interface GenerateS3KeyParams {
  userId: string
  year: number
  month: number
  timestamp: Date
}

/**
 * Generate an S3 object key following the pattern:
 * videos/{userId}/{year}/{month}/recap-{year}-{month}-{timestamp}.mp4
 *
 * @param params - Parameters for key generation
 * @returns The generated S3 object key
 */
export function generateS3Key(params: GenerateS3KeyParams): string {
  const { userId, year, month, timestamp } = params

  // Zero-pad month to two digits
  const paddedMonth = String(month).padStart(2, '0')

  // Format timestamp as ISO 8601 compact format: YYYYMMDDTHHmmssZ
  const isoTimestamp = timestamp
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

  return `videos/${userId}/${year}/${paddedMonth}/recap-${year}-${paddedMonth}-${isoTimestamp}.mp4`
}

/**
 * Parameters for generating a public S3 URL
 */
export interface GeneratePublicUrlParams {
  bucket: string
  region: string
  key: string
}

/**
 * Generate a public S3 URL for an object
 * Format: https://{bucket}.s3.{region}.amazonaws.com/{key}
 *
 * @param params - Parameters for URL generation
 * @returns The public S3 URL
 */
export function generatePublicUrl(params: GeneratePublicUrlParams): string {
  const { bucket, region, key } = params
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

/**
 * Parameters for uploading a file to S3
 */
export interface UploadToS3Params {
  filePath: string
  key: string
}

/**
 * Upload result containing the S3 key and public URL
 */
export interface UploadResult {
  key: string
  url: string
}

/**
 * Upload a file to S3
 *
 * @param params - Upload parameters
 * @returns The upload result with key and public URL
 * @throws Error if upload fails
 */
export async function uploadToS3(params: UploadToS3Params): Promise<UploadResult> {
  const { filePath, key } = params
  const config = getS3Config()

  console.log(`[S3] Starting upload: ${key}`)

  // Read file from disk
  const fileBuffer = await fs.readFile(filePath)
  const fileSize = fileBuffer.length
  console.log(`[S3] File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)

  // Upload to S3
  const client = getS3Client()
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: 'video/mp4',
  })

  try {
    await client.send(command)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown S3 error'
    console.error(`[S3] Upload failed: ${errorMessage}`)
    throw new Error(`S3 upload failed: ${errorMessage}`)
  }

  // Generate public URL
  const url = generatePublicUrl({
    bucket: config.bucketName,
    region: config.region,
    key,
  })

  console.log(`[S3] Upload successful: ${url}`)

  return { key, url }
}
