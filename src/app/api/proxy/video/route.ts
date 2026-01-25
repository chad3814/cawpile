import { NextRequest, NextResponse } from 'next/server'

/**
 * S3 bucket pattern for allowed video domains.
 * Matches cawpile-*.s3.*.amazonaws.com format.
 */
const S3_BUCKET_PATTERN = /^cawpile-[a-z0-9-]+\.s3\.[a-z0-9-]+\.amazonaws\.com$/

/**
 * Path-style S3 hostname pattern.
 * Matches s3.*.amazonaws.com format.
 */
const S3_PATH_STYLE_PATTERN = /^s3\.[a-z0-9-]+\.amazonaws\.com$/

/**
 * Check if a hostname matches the allowed S3 bucket pattern.
 * Supports bucket subdomain style: cawpile-*.s3.*.amazonaws.com
 */
function isAllowedS3Hostname(hostname: string): boolean {
  return S3_BUCKET_PATTERN.test(hostname)
}

/**
 * Check if a URL is from an allowed S3 bucket.
 * Supports both bucket subdomain and path-style URLs.
 *
 * Bucket subdomain style: https://cawpile-{name}.s3.{region}.amazonaws.com/path
 * Path-style: https://s3.{region}.amazonaws.com/cawpile-{name}/path
 */
function isAllowedS3Url(url: URL): boolean {
  // Bucket subdomain style: cawpile-*.s3.*.amazonaws.com
  if (isAllowedS3Hostname(url.hostname)) {
    return true
  }

  // Path-style: s3.*.amazonaws.com/cawpile-*
  if (S3_PATH_STYLE_PATTERN.test(url.hostname)) {
    // Check if first path segment starts with cawpile-
    const pathSegments = url.pathname.split('/').filter(Boolean)
    if (pathSegments.length > 0 && pathSegments[0].startsWith('cawpile-')) {
      return true
    }
  }

  return false
}

/**
 * Proxies video files from S3 to enable download with correct headers.
 *
 * The HTML5 download attribute only works for same-origin URLs.
 * This proxy fetches the video from S3 and serves it with
 * Content-Disposition: attachment to force download instead of playback.
 *
 * Query parameters:
 * - url: The S3 URL to fetch (required)
 * - filename: The filename for the downloaded file (optional, defaults to extracted from URL)
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  const filename = request.nextUrl.searchParams.get('filename')

  // Validate url parameter is present
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Validate URL format and domain
  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Validate URL is from allowed S3 bucket
  if (!isAllowedS3Url(parsedUrl)) {
    console.warn('Video proxy: Domain not allowed:', parsedUrl.hostname)
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
  }

  try {
    // Fetch video from S3 with 5-minute timeout for large files
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000) // 5 minutes

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cawpile/1.0)',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('Video proxy: Upstream fetch failed:', response.status, response.statusText)
      return NextResponse.json(
        { error: 'Failed to fetch video' },
        { status: 502 }
      )
    }

    // Determine filename for Content-Disposition header
    const downloadFilename = filename || extractFilename(parsedUrl.pathname)

    // Stream the response body directly to avoid buffering large files
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('Video proxy: Request timed out')
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 504 }
      )
    }

    console.error('Video proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 502 }
    )
  }
}

/**
 * Extract filename from URL pathname.
 * Falls back to 'video.mp4' if no filename can be extracted.
 */
function extractFilename(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]

  if (lastSegment && lastSegment.includes('.')) {
    return lastSegment
  }

  return 'video.mp4'
}
