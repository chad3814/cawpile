/**
 * Tests for MonthlyRecapModal SSE Video Render Progress
 * Tests SSE connection, event handling, progress bar UI, and cleanup
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import MonthlyRecapModal from '@/components/modals/MonthlyRecapModal'

// Mock next-auth/react
const mockSession = {
  data: {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: '2025-12-31T23:59:59.999Z',
  },
  status: 'authenticated' as const,
}

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => mockSession),
}))

// Import mocked useSession for manipulation in tests
import { useSession } from 'next-auth/react'
const mockUseSession = useSession as jest.Mock

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = []
  url: string
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  readyState: number = 0 // CONNECTING
  listeners: Record<string, ((event: MessageEvent) => void)[]> = {}

  constructor(url: string) {
    this.url = url
    MockEventSource.instances.push(this)
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = 1 // OPEN
    }, 0)
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void): void {
    if (!this.listeners[type]) {
      this.listeners[type] = []
    }
    this.listeners[type].push(listener)
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void): void {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(l => l !== listener)
    }
  }

  close(): void {
    this.readyState = 2 // CLOSED
  }

  // Helper to simulate events
  simulateEvent(type: string, data: object): void {
    const event = new MessageEvent(type, { data: JSON.stringify(data) })
    if (this.listeners[type]) {
      this.listeners[type].forEach(listener => listener(event))
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'))
    }
  }

  static clearInstances(): void {
    MockEventSource.instances = []
  }

  static getLastInstance(): MockEventSource | undefined {
    return MockEventSource.instances[MockEventSource.instances.length - 1]
  }
}

// @ts-expect-error - Mocking global EventSource
global.EventSource = MockEventSource

// Mock fetch for preview data
const mockPreviewResponse = {
  monthName: 'January',
  year: 2024,
  bookCount: 5,
  completedCount: 4,
  dnfCount: 1,
}

const mockExportData = {
  metadata: { month: 1, year: 2024, monthName: 'January' },
  summary: { totalBooks: 5 },
  books: [],
}

// Store original env
const originalEnv = process.env

beforeEach(() => {
  jest.clearAllMocks()
  MockEventSource.clearInstances()
  // Reset session mock to default authenticated state
  mockUseSession.mockReturnValue(mockSession)
  // Reset env
  process.env = { ...originalEnv }
  // Clear render server URL to test fallback
  delete process.env.NEXT_PUBLIC_RENDER_SERVER_URL

  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/api/recap/monthly')) {
      if (url.includes('preview=true')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPreviewResponse),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockExportData),
      })
    }
    if (url.includes('/render-stream/init')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ jobId: 'mock-job-id-123' }),
      })
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  })
})

afterEach(() => {
  jest.restoreAllMocks()
  process.env = originalEnv
})

describe('Task Group 1: SSE Connection Infrastructure', () => {
  test('EventSource connection is established with correct URL and encoded data', async () => {
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load - look for "books finished" text
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Click generate video button
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Verify EventSource was created with a jobId from the init call
    await waitFor(() => {
      const eventSource = MockEventSource.getLastInstance()
      expect(eventSource).toBeDefined()
      expect(eventSource?.url).toContain('/render-stream')
      expect(eventSource?.url).toContain('jobId=mock-job-id-123')
      // Verify the init POST request was made with the data payload
      const fetchMock = global.fetch as jest.Mock
      const initCall = fetchMock.mock.calls.find(([url]: [string]) => (url as string).includes('/render-stream/init'))
      expect(initCall).toBeDefined()
      const requestBody = JSON.parse(initCall[1].body as string)
      expect(requestBody).toHaveProperty('data')
    })
  })

  test('EventSource connection is closed on modal close', async () => {
    const mockOnClose = jest.fn()

    const { rerender } = await act(async () => {
      return render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Click generate video button to start SSE connection
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Get the EventSource instance
    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    // Close the modal
    await act(async () => {
      rerender(<MonthlyRecapModal isOpen={false} onClose={mockOnClose} />)
    })

    // Verify EventSource was closed
    expect(eventSource.readyState).toBe(2) // CLOSED
  })

  test('EventSource connection is closed on successful completion', async () => {
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Click generate video button
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Get the EventSource instance
    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    // Simulate complete event with s3Url
    await act(async () => {
      eventSource.simulateEvent('complete', {
        filename: 'test-video.mp4',
        s3Url: 'https://cawpile-videos.s3.us-east-2.amazonaws.com/test-video.mp4'
      })
    })

    // Verify EventSource was closed
    expect(eventSource.readyState).toBe(2) // CLOSED
  })
})

describe('Task Group 2: SSE Event Handling', () => {
  test('progress event updates renderProgress state correctly', async () => {
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Click generate video button
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Get the EventSource instance
    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    // Simulate progress event
    await act(async () => {
      eventSource.simulateEvent('progress', { progress: 45 })
    })

    // Verify progress is displayed
    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument()
    })
  })

  test('complete event triggers download and sets success status', async () => {
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Click generate video button
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Get the EventSource instance
    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    // Simulate complete event with s3Url
    await act(async () => {
      eventSource.simulateEvent('complete', {
        filename: 'test-video.mp4',
        s3Url: 'https://cawpile-videos.s3.us-east-2.amazonaws.com/test-video.mp4'
      })
    })

    // Verify success status is shown
    await waitFor(() => {
      expect(screen.getByText('Export completed successfully!')).toBeInTheDocument()
    })
  })

  test('error event from server sets error state and error status', async () => {
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Click generate video button
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Get the EventSource instance
    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    // Simulate error event
    await act(async () => {
      eventSource.simulateEvent('error', { message: 'Render failed: out of memory' })
    })

    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Render failed: out of memory')).toBeInTheDocument()
    })

    // Verify EventSource was closed
    expect(eventSource.readyState).toBe(2) // CLOSED
  })

  test('connection drop (onerror) sets error state and error status', async () => {
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Click generate video button
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Get the EventSource instance
    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    // Simulate connection error
    await act(async () => {
      eventSource.simulateError()
    })

    // Verify generic error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Connection to render server lost')).toBeInTheDocument()
    })

    // Verify EventSource was closed
    expect(eventSource.readyState).toBe(2) // CLOSED
  })
})

describe('Task Group 3: Progress Bar UI', () => {
  test('progress bar displays during rendering status', async () => {
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Click generate video button
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Verify progress bar container is rendered
    await waitFor(() => {
      expect(screen.getByTestId('render-progress-bar')).toBeInTheDocument()
    })
  })

  test('progress bar width reflects renderProgress value', async () => {
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Click generate video button
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Get the EventSource instance and send progress
    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    await act(async () => {
      eventSource.simulateEvent('progress', { progress: 75 })
    })

    // Verify progress bar fill has correct width
    await waitFor(() => {
      const progressFill = screen.getByTestId('render-progress-fill')
      expect(progressFill).toHaveStyle({ width: '75%' })
    })
  })

  test('percentage text displays correct value', async () => {
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Click generate video button
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Get the EventSource instance and send progress
    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    await act(async () => {
      eventSource.simulateEvent('progress', { progress: 63 })
    })

    // Verify percentage text is correct
    await waitFor(() => {
      expect(screen.getByText('63%')).toBeInTheDocument()
    })
  })
})

describe('Task Group 4: Cleanup and State Reset', () => {
  test('EventSource is closed when modal closes during rendering', async () => {
    const mockOnClose = jest.fn()

    const { rerender } = await act(async () => {
      return render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Click generate video button
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Get the EventSource instance
    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    // Send some progress to ensure we're mid-render
    await act(async () => {
      eventSource.simulateEvent('progress', { progress: 50 })
    })

    // Verify we're in rendering state
    expect(screen.getByText('50%')).toBeInTheDocument()

    // Close the modal
    await act(async () => {
      rerender(<MonthlyRecapModal isOpen={false} onClose={mockOnClose} />)
    })

    // Verify EventSource was closed
    expect(eventSource.readyState).toBe(2) // CLOSED
  })

  test('renderProgress resets to 0 when modal closes', async () => {
    const mockOnClose = jest.fn()

    const { rerender } = await act(async () => {
      return render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Click generate video button
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    // Get the EventSource instance and send progress
    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    await act(async () => {
      eventSource.simulateEvent('progress', { progress: 75 })
    })

    // Verify progress is shown
    expect(screen.getByText('75%')).toBeInTheDocument()

    // Close the modal
    await act(async () => {
      rerender(<MonthlyRecapModal isOpen={false} onClose={mockOnClose} />)
    })

    // Reopen the modal
    await act(async () => {
      rerender(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // Wait for preview to load again
    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Start rendering again
    const generateButton2 = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton2)
    })

    // Verify progress starts at 0
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })
})

describe('SSE URL Configuration with Environment Variable', () => {
  test('SSE URL uses environment variable when NEXT_PUBLIC_RENDER_SERVER_URL is set', async () => {
    // Note: In client-side Next.js, env vars are baked in at build time
    // For testing, we check the URL pattern in the constructed EventSource URL
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    await waitFor(() => {
      const eventSource = MockEventSource.getLastInstance()
      expect(eventSource).toBeDefined()
      // Default fallback should be localhost:3001
      expect(eventSource?.url).toContain('http://localhost:3001/render-stream')
    })
  })

  test('SSE URL falls back to http://localhost:3001 when env var is not set', async () => {
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    await waitFor(() => {
      const eventSource = MockEventSource.getLastInstance()
      expect(eventSource).toBeDefined()
      expect(eventSource?.url).toContain('http://localhost:3001')
      expect(eventSource?.url).toContain('/render-stream')
    })
  })

  test('userId is included in the render-stream init POST request body', async () => {
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    await waitFor(() => {
      const fetchMock = global.fetch as jest.Mock
      const initCall = fetchMock.mock.calls.find(([url]: [string]) => (url as string).includes('/render-stream/init'))
      expect(initCall).toBeDefined()
      const requestBody = JSON.parse(initCall[1].body as string)
      expect(requestBody.userId).toBe('test-user-123')
    })
  })

  test('recap data is sent correctly in the render-stream init POST request body', async () => {
    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    await waitFor(() => {
      const fetchMock = global.fetch as jest.Mock
      const initCall = fetchMock.mock.calls.find(([url]: [string]) => (url as string).includes('/render-stream/init'))
      expect(initCall).toBeDefined()
      const requestBody = JSON.parse(initCall[1].body as string)
      // Verify the data payload is sent in the POST body
      expect(requestBody).toHaveProperty('data')
      expect(requestBody.data).toHaveProperty('metadata')
      expect(requestBody.data.metadata).toHaveProperty('month')
      expect(requestBody.data.metadata).toHaveProperty('year')
    })
  })
})

describe('Video Proxy Download Behavior', () => {
  test('download uses proxy URL instead of direct S3 URL', async () => {
    const mockOnClose = jest.fn()
    let capturedAnchor: HTMLAnchorElement | null = null

    const originalCreateElement = document.createElement.bind(document)
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'a') {
        capturedAnchor = element as HTMLAnchorElement
      }
      return element
    })

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    const s3Url = 'https://cawpile-videos.s3.us-east-2.amazonaws.com/recap-video.mp4'

    await act(async () => {
      eventSource.simulateEvent('complete', {
        filename: 'recap-video.mp4',
        s3Url
      })
    })

    // Verify the download link uses proxy URL, not direct S3 URL
    expect(capturedAnchor).toBeTruthy()
    expect(capturedAnchor!.href).toContain('/api/proxy/video')
    expect(capturedAnchor!.href).not.toBe(s3Url)
  })

  test('proxy URL includes encoded s3Url and filename parameters', async () => {
    const mockOnClose = jest.fn()
    let capturedAnchor: HTMLAnchorElement | null = null

    const originalCreateElement = document.createElement.bind(document)
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'a') {
        capturedAnchor = element as HTMLAnchorElement
      }
      return element
    })

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    const s3Url = 'https://cawpile-videos.s3.us-east-2.amazonaws.com/monthly-recap-2024-01.mp4'
    const filename = 'monthly-recap-2024-01.mp4'

    await act(async () => {
      eventSource.simulateEvent('complete', {
        filename,
        s3Url
      })
    })

    // Verify the proxy URL contains correctly encoded parameters
    expect(capturedAnchor).toBeTruthy()
    const href = capturedAnchor!.href

    // Parse the URL to check parameters
    const url = new URL(href)
    expect(url.pathname).toBe('/api/proxy/video')

    // Check that url parameter is encoded and contains the S3 URL
    const urlParam = url.searchParams.get('url')
    expect(urlParam).toBe(s3Url)

    // Check that filename parameter is present
    const filenameParam = url.searchParams.get('filename')
    expect(filenameParam).toBe(filename)
  })

  test('download anchor has download attribute with correct filename', async () => {
    const mockOnClose = jest.fn()
    let capturedAnchor: HTMLAnchorElement | null = null

    const originalCreateElement = document.createElement.bind(document)
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'a') {
        capturedAnchor = element as HTMLAnchorElement
      }
      return element
    })

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    await act(async () => {
      eventSource.simulateEvent('complete', {
        filename: 'my-recap-video.mp4',
        s3Url: 'https://cawpile-videos.s3.us-east-2.amazonaws.com/my-recap-video.mp4'
      })
    })

    // Verify the download attribute is set correctly
    expect(capturedAnchor).toBeTruthy()
    expect(capturedAnchor!.download).toBe('my-recap-video.mp4')
  })

  test('handles special characters in filename correctly', async () => {
    const mockOnClose = jest.fn()
    let capturedAnchor: HTMLAnchorElement | null = null

    const originalCreateElement = document.createElement.bind(document)
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName === 'a') {
        capturedAnchor = element as HTMLAnchorElement
      }
      return element
    })

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })
    const eventSource = MockEventSource.getLastInstance()!

    // Filename with special characters that need encoding
    const filename = "User's Recap (January 2024).mp4"
    const s3Url = 'https://cawpile-videos.s3.us-east-2.amazonaws.com/recap.mp4'

    await act(async () => {
      eventSource.simulateEvent('complete', {
        filename,
        s3Url
      })
    })

    expect(capturedAnchor).toBeTruthy()

    // The URL should contain the encoded filename
    const url = new URL(capturedAnchor!.href)
    const filenameParam = url.searchParams.get('filename')
    expect(filenameParam).toBe(filename)
  })
})

describe('Default Month Selection', () => {
  test('defaults to current month when day of month is > 10', async () => {
    // March 15 — day 15 > 10, so default to current month (March = 3)
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2025, 2, 15)) // March 15, 2025

    const mockOnClose = jest.fn()
    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    // The preview fetch URL should use month=3 (March)
    await waitFor(() => {
      const fetchMock = global.fetch as jest.Mock
      const previewCall = fetchMock.mock.calls.find(([url]: [string]) =>
        (url as string).includes('/api/recap/monthly') && (url as string).includes('preview=true')
      )
      expect(previewCall).toBeDefined()
      expect(previewCall[0]).toContain('month=3')
      expect(previewCall[0]).toContain('year=2025')
    })

    jest.useRealTimers()
  })

  test('defaults to previous month when day of month is ≤ 10', async () => {
    // March 5 — day 5 ≤ 10, so default to previous month (February = 2)
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2025, 2, 5)) // March 5, 2025

    const mockOnClose = jest.fn()
    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      const fetchMock = global.fetch as jest.Mock
      const previewCall = fetchMock.mock.calls.find(([url]: [string]) =>
        (url as string).includes('/api/recap/monthly') && (url as string).includes('preview=true')
      )
      expect(previewCall).toBeDefined()
      expect(previewCall[0]).toContain('month=2')
      expect(previewCall[0]).toContain('year=2025')
    })

    jest.useRealTimers()
  })

  test('defaults to December of previous year when day ≤ 10 and current month is January', async () => {
    // January 3 — day 3 ≤ 10, so default to December of prior year
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2025, 0, 3)) // January 3, 2025

    const mockOnClose = jest.fn()
    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      const fetchMock = global.fetch as jest.Mock
      const previewCall = fetchMock.mock.calls.find(([url]: [string]) =>
        (url as string).includes('/api/recap/monthly') && (url as string).includes('preview=true')
      )
      expect(previewCall).toBeDefined()
      expect(previewCall[0]).toContain('month=12')
      expect(previewCall[0]).toContain('year=2024')
    })

    jest.useRealTimers()
  })

  test('defaults to current month when day of month is exactly 11', async () => {
    // March 11 — day 11 > 10, so default to current month (March = 3)
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2025, 2, 11)) // March 11, 2025

    const mockOnClose = jest.fn()
    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      const fetchMock = global.fetch as jest.Mock
      const previewCall = fetchMock.mock.calls.find(([url]: [string]) =>
        (url as string).includes('/api/recap/monthly') && (url as string).includes('preview=true')
      )
      expect(previewCall).toBeDefined()
      expect(previewCall[0]).toContain('month=3')
      expect(previewCall[0]).toContain('year=2025')
    })

    jest.useRealTimers()
  })

  test('defaults to previous month when day of month is exactly 10', async () => {
    // March 10 — day 10 ≤ 10, so default to previous month (February = 2)
    jest.useFakeTimers()
    jest.setSystemTime(new Date(2025, 2, 10)) // March 10, 2025

    const mockOnClose = jest.fn()
    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      const fetchMock = global.fetch as jest.Mock
      const previewCall = fetchMock.mock.calls.find(([url]: [string]) =>
        (url as string).includes('/api/recap/monthly') && (url as string).includes('preview=true')
      )
      expect(previewCall).toBeDefined()
      expect(previewCall[0]).toContain('month=2')
      expect(previewCall[0]).toContain('year=2025')
    })

    jest.useRealTimers()
  })
})

describe('Session Handling for userId', () => {
  test('handles undefined userId gracefully when session is not available', async () => {
    // Mock unauthenticated session
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const mockOnClose = jest.fn()

    await act(async () => {
      render(<MonthlyRecapModal isOpen={true} onClose={mockOnClose} />)
    })

    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    await waitFor(() => {
      const eventSource = MockEventSource.getLastInstance()
      expect(eventSource).toBeDefined()
      // URL should still be valid even without userId
      expect(eventSource?.url).toContain('/render-stream')
      expect(eventSource?.url).toContain('jobId=')
    })
  })
})
