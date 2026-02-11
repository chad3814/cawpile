/**
 * @jest-environment node
 */
import { createHash } from 'crypto'

// ============================================================================
// Mock AWS SDK before importing module under test
// ============================================================================
const mockS3Send = jest.fn()

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn(() => ({ send: mockS3Send })),
    HeadObjectCommand: jest.fn((input: unknown) => ({ _type: 'HeadObject', input })),
    PutObjectCommand: jest.fn((input: unknown) => ({ _type: 'PutObject', input })),
  }
})

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

import {
  generateCoverCacheKey,
  cacheBookCoverToS3,
  cacheCoverUrls,
} from '@/lib/cover-cache'
import { PutObjectCommand } from '@aws-sdk/client-s3'

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

// ============================================================================
// generateCoverCacheKey
// ============================================================================
describe('generateCoverCacheKey', () => {
  test('generates deterministic key from URL', () => {
    const url = 'https://books.google.com/content?id=abc&img=1'
    const key1 = generateCoverCacheKey(url)
    const key2 = generateCoverCacheKey(url)
    expect(key1).toBe(key2)
  })

  test('key uses sha256 hash of the URL', () => {
    const url = 'https://example.com/cover.jpg'
    const expectedHash = createHash('sha256').update(url).digest('hex')
    expect(generateCoverCacheKey(url)).toBe(`covers/${expectedHash}.jpg`)
  })

  test('uses provided extension', () => {
    const url = 'https://example.com/cover.png'
    const key = generateCoverCacheKey(url, 'png')
    expect(key).toMatch(/\.png$/)
  })

  test('defaults to jpg extension', () => {
    const key = generateCoverCacheKey('https://example.com/image')
    expect(key).toMatch(/\.jpg$/)
  })

  test('different URLs produce different keys', () => {
    const key1 = generateCoverCacheKey('https://example.com/a.jpg')
    const key2 = generateCoverCacheKey('https://example.com/b.jpg')
    expect(key1).not.toBe(key2)
  })
})

// ============================================================================
// cacheBookCoverToS3
// ============================================================================
describe('cacheBookCoverToS3', () => {
  const TEST_URL = 'https://books.google.com/content?id=abc&img=1&source=gbs_api'

  test('returns cached S3 URL when object already exists (HeadObject succeeds)', async () => {
    mockS3Send.mockResolvedValueOnce({}) // HeadObject succeeds

    const result = await cacheBookCoverToS3(TEST_URL)

    expect(result).toMatch(/^https:\/\/cawpile-downloads\.s3\.us-east-2\.amazonaws\.com\/covers\//)
    expect(result).toMatch(/\.jpg$/)
    // Should NOT have called fetch since it was already cached
    expect(mockFetch).not.toHaveBeenCalled()
    // Should NOT have uploaded
    expect(mockS3Send).toHaveBeenCalledTimes(1) // only HeadObject
  })

  test('fetches image and uploads to S3 when not cached', async () => {
    // HeadObject throws (not found)
    mockS3Send.mockRejectedValueOnce(new Error('NotFound'))
    // PutObject succeeds
    mockS3Send.mockResolvedValueOnce({})

    const imageBuffer = Buffer.from('fake-image-data')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: () => Promise.resolve(imageBuffer.buffer),
    })

    const result = await cacheBookCoverToS3(TEST_URL)

    expect(result).toMatch(/^https:\/\/cawpile-downloads\.s3\.us-east-2\.amazonaws\.com\/covers\//)
    expect(mockFetch).toHaveBeenCalledWith(TEST_URL, expect.objectContaining({ signal: expect.any(AbortSignal) }))
    expect(mockS3Send).toHaveBeenCalledTimes(2) // HeadObject + PutObject
    // Verify PutObject was called with correct bucket
    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'cawpile-downloads',
        ContentType: 'image/jpeg',
        CacheControl: 'max-age=259200',
      })
    )
  })

  test('detects extension from URL path', async () => {
    const pngUrl = 'https://example.com/cover.png'
    mockS3Send.mockRejectedValueOnce(new Error('NotFound'))
    mockS3Send.mockResolvedValueOnce({})

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: () => Promise.resolve(Buffer.from('png-data').buffer),
    })

    const result = await cacheBookCoverToS3(pngUrl)

    expect(result).toMatch(/\.png$/)
  })

  test('falls back to Content-Type header when URL has no extension', async () => {
    const noExtUrl = 'https://books.google.com/content?id=abc'
    mockS3Send.mockRejectedValueOnce(new Error('NotFound'))
    mockS3Send.mockResolvedValueOnce({})

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'image/webp' }),
      arrayBuffer: () => Promise.resolve(Buffer.from('webp-data').buffer),
    })

    const result = await cacheBookCoverToS3(noExtUrl)

    expect(result).toMatch(/\.webp$/)
  })

  test('defaults to jpg when no extension in URL and no Content-Type match', async () => {
    const noExtUrl = 'https://books.google.com/content?id=abc'
    mockS3Send.mockRejectedValueOnce(new Error('NotFound'))
    mockS3Send.mockResolvedValueOnce({})

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/octet-stream' }),
      arrayBuffer: () => Promise.resolve(Buffer.from('data').buffer),
    })

    const result = await cacheBookCoverToS3(noExtUrl)

    expect(result).toMatch(/\.jpg$/)
  })

  test('returns original URL when fetch fails (non-ok response)', async () => {
    mockS3Send.mockRejectedValueOnce(new Error('NotFound'))

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
    })

    const result = await cacheBookCoverToS3(TEST_URL)

    expect(result).toBe(TEST_URL)
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('429'))
  })

  test('returns original URL when S3 upload fails', async () => {
    mockS3Send.mockRejectedValueOnce(new Error('NotFound')) // HeadObject
    mockS3Send.mockRejectedValueOnce(new Error('AccessDenied')) // PutObject

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: () => Promise.resolve(Buffer.from('data').buffer),
    })

    const result = await cacheBookCoverToS3(TEST_URL)

    expect(result).toBe(TEST_URL)
    expect(console.warn).toHaveBeenCalled()
  })

  test('returns original URL when fetch throws (network error)', async () => {
    mockS3Send.mockRejectedValueOnce(new Error('NotFound'))
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await cacheBookCoverToS3(TEST_URL)

    expect(result).toBe(TEST_URL)
  })
})

// ============================================================================
// cacheCoverUrls
// ============================================================================
describe('cacheCoverUrls', () => {
  test('returns a Map with S3 URLs for each input', async () => {
    // Both HeadObject calls succeed (already cached)
    mockS3Send.mockResolvedValue({})

    const urls = [
      'https://example.com/cover1.jpg',
      'https://example.com/cover2.jpg',
    ]

    const result = await cacheCoverUrls(urls)

    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(2)
    for (const url of urls) {
      expect(result.get(url)).toMatch(/^https:\/\/cawpile-downloads\.s3\./)
    }
  })

  test('filters out null and undefined values', async () => {
    mockS3Send.mockResolvedValue({})

    const urls = [null, 'https://example.com/cover.jpg', undefined, null]

    const result = await cacheCoverUrls(urls)

    expect(result.size).toBe(1)
    expect(result.has('https://example.com/cover.jpg')).toBe(true)
  })

  test('deduplicates identical URLs', async () => {
    mockS3Send.mockResolvedValue({})

    const url = 'https://example.com/cover.jpg'
    const result = await cacheCoverUrls([url, url, url])

    expect(result.size).toBe(1)
    // HeadObject should only be called once (not 3 times)
    expect(mockS3Send).toHaveBeenCalledTimes(1)
  })

  test('returns empty Map for empty input', async () => {
    const result = await cacheCoverUrls([])

    expect(result.size).toBe(0)
    expect(mockS3Send).not.toHaveBeenCalled()
  })

  test('returns empty Map for all-null input', async () => {
    const result = await cacheCoverUrls([null, undefined, null])

    expect(result.size).toBe(0)
  })

  test('handles partial failures gracefully', async () => {
    // First URL: HeadObject succeeds (cached)
    mockS3Send.mockResolvedValueOnce({})
    // Second URL: HeadObject fails, fetch fails
    mockS3Send.mockRejectedValueOnce(new Error('NotFound'))
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    const urls = [
      'https://example.com/cached.jpg',
      'https://example.com/broken.jpg',
    ]

    const result = await cacheCoverUrls(urls)

    // Both should be in the map — cached gets S3 URL, broken gets original
    expect(result.size).toBe(2)
    expect(result.get(urls[0])).toMatch(/^https:\/\/cawpile-downloads\.s3\./)
    expect(result.get(urls[1])).toBe(urls[1])
  })
})
