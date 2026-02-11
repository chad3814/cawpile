import { createHash } from 'crypto'
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'

const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
const AWS_REGION = process.env.AWS_REGION || 'us-east-2'
const COVER_CACHE_BUCKET = 'cawpile-downloads'

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials:
    AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
})

function getPublicUrl(key: string): string {
  return `https://${COVER_CACHE_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`
}

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function getExtensionFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    const match = pathname.match(/\.(jpe?g|png|webp|gif)$/i)
    return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : null
  } catch {
    return null
  }
}

/**
 * Generate a deterministic S3 key for a cover image URL.
 * Uses SHA-256 hash of the URL to deduplicate.
 */
export function generateCoverCacheKey(url: string, ext: string = 'jpg'): string {
  const hash = createHash('sha256').update(url).digest('hex')
  return `covers/${hash}.${ext}`
}

/**
 * Cache a book cover image to S3. Returns the S3 public URL on success,
 * or the original URL on any failure.
 */
export async function cacheBookCoverToS3(url: string): Promise<string> {
  try {
    // Determine extension from the URL first
    let ext = getExtensionFromUrl(url)

    // Generate key with preliminary extension (may update after fetch)
    const prelimKey = generateCoverCacheKey(url, ext || 'jpg')

    // Check if already cached
    try {
      await s3Client.send(
        new HeadObjectCommand({
          Bucket: COVER_CACHE_BUCKET,
          Key: prelimKey,
        })
      )
      // Already exists — return cached URL
      return getPublicUrl(prelimKey)
    } catch {
      // Not found — continue to fetch and upload
    }

    // Fetch the image
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!response.ok) {
      console.warn(`Cover cache: failed to fetch ${url} (${response.status})`)
      return url
    }

    // If we didn't get extension from URL, try Content-Type
    if (!ext) {
      const contentType = response.headers.get('content-type') || ''
      ext = CONTENT_TYPE_TO_EXT[contentType.split(';')[0].trim()] || 'jpg'
    }

    const key = generateCoverCacheKey(url, ext)
    const buffer = Buffer.from(await response.arrayBuffer())

    // Determine content type for S3
    const contentType =
      response.headers.get('content-type') || `image/${ext === 'jpg' ? 'jpeg' : ext}`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: COVER_CACHE_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'max-age=259200', // 3 days (matches bucket lifecycle)
      })
    )

    return getPublicUrl(key)
  } catch (error) {
    console.warn(`Cover cache: error caching ${url}:`, error)
    return url
  }
}

/**
 * Cache multiple cover URLs to S3 in parallel.
 * Returns a Map from original URL → S3 URL (or original on failure).
 */
export async function cacheCoverUrls(
  urls: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const uniqueUrls = [...new Set(urls.filter((u): u is string => !!u))]

  const results = await Promise.allSettled(
    uniqueUrls.map(async (url) => ({
      original: url,
      cached: await cacheBookCoverToS3(url),
    }))
  )

  const urlMap = new Map<string, string>()
  for (const result of results) {
    if (result.status === 'fulfilled') {
      urlMap.set(result.value.original, result.value.cached)
    }
  }

  return urlMap
}
