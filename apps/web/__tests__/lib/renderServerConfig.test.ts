/**
 * Tests for Render Server Configuration
 * Tests environment variable reading and fallback behavior
 * @jest-environment node
 */

// Store original env
const originalEnv = process.env

describe('Render Server URL Configuration', () => {
  beforeEach(() => {
    // Reset modules to ensure fresh env reads
    jest.resetModules()
    // Clone original env
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('Environment Variable Reading', () => {
    test('NEXT_PUBLIC_RENDER_SERVER_URL is read correctly when set', () => {
      process.env.NEXT_PUBLIC_RENDER_SERVER_URL = 'https://render.cawpile.org'

      const renderServerUrl = process.env.NEXT_PUBLIC_RENDER_SERVER_URL || 'http://localhost:3001'

      expect(renderServerUrl).toBe('https://render.cawpile.org')
    })

    test('falls back to http://localhost:3001 when env var is not set', () => {
      delete process.env.NEXT_PUBLIC_RENDER_SERVER_URL

      const renderServerUrl = process.env.NEXT_PUBLIC_RENDER_SERVER_URL || 'http://localhost:3001'

      expect(renderServerUrl).toBe('http://localhost:3001')
    })

    test('URL construction works with environment variable value', () => {
      process.env.NEXT_PUBLIC_RENDER_SERVER_URL = 'https://render.cawpile.org'

      const renderServerUrl = process.env.NEXT_PUBLIC_RENDER_SERVER_URL || 'http://localhost:3001'
      const encodedData = encodeURIComponent(JSON.stringify({ test: 'data' }))
      const userId = 'user-123'

      const sseUrl = `${renderServerUrl}/render-stream?data=${encodedData}&userId=${userId}`

      expect(sseUrl).toContain('https://render.cawpile.org/render-stream')
      expect(sseUrl).toContain('data=')
      expect(sseUrl).toContain('userId=user-123')
    })

    test('URL construction works with fallback localhost value', () => {
      delete process.env.NEXT_PUBLIC_RENDER_SERVER_URL

      const renderServerUrl = process.env.NEXT_PUBLIC_RENDER_SERVER_URL || 'http://localhost:3001'
      const encodedData = encodeURIComponent(JSON.stringify({ test: 'data' }))
      const userId = 'user-456'

      const sseUrl = `${renderServerUrl}/render-stream?data=${encodedData}&userId=${userId}`

      expect(sseUrl).toContain('http://localhost:3001/render-stream')
      expect(sseUrl).toContain('data=')
      expect(sseUrl).toContain('userId=user-456')
    })
  })
})
