import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxies external images to avoid CORS issues with html2canvas.
 * Used specifically for generating shareable review images.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Validate URL is from allowed domains (Google Books)
  const allowedDomains = [
    'books.google.com',
    'books.googleusercontent.com',
    'lh3.googleusercontent.com',
  ]

  try {
    const parsedUrl = new URL(url)
    if (!allowedDomains.some(domain => parsedUrl.hostname.includes(domain))) {
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
