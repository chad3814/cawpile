import { NextRequest, NextResponse } from 'next/server'

/**
 * Allowed domains for image proxying.
 * These domains are trusted sources for book cover images.
 */
const ALLOWED_DOMAINS = [
  // Google Books domains
  'books.google.com',
  'books.googleusercontent.com',
  'lh3.googleusercontent.com',
  // Hardcover domains
  'cdn.hardcover.app',
  'hardcover.app',
  'storage.googleapis.com',
  // IBDB and external book image sources
  'images-na.ssl-images-amazon.com',
  'covers.openlibrary.org',
  'm.media-amazon.com',
]

/**
 * Check if a hostname matches an allowed domain.
 * Uses exact match or subdomain match (hostname ends with .domain).
 */
function isAllowedHostname(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(domain => {
    // Exact match
    if (hostname === domain) {
      return true
    }
    // Subdomain match (e.g., cdn.hardcover.app matches hardcover.app)
    if (hostname.endsWith('.' + domain)) {
      return true
    }
    return false
  })
}

/**
 * Proxies external images to avoid CORS issues with html2canvas.
 * Used specifically for generating shareable review images.
 * Supports Google Books, Hardcover, and IBDB image sources.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Validate URL is from allowed domains
  try {
    const parsedUrl = new URL(url)
    if (!isAllowedHostname(parsedUrl.hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Cawpile/1.0)',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type')
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 })
  }
}
