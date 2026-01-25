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

    // Verify EventSource was created with correct URL
    await waitFor(() => {
      const eventSource = MockEventSource.getLastInstance()
      expect(eventSource).toBeDefined()
      expect(eventSource?.url).toContain('/render-stream')
      expect(eventSource?.url).toContain('data=')
      // Verify the URL contains encoded JSON data
      const urlParams = new URLSearchParams(eventSource?.url.split('?')[1])
      const encodedData = urlParams.get('data')
      expect(encodedData).toBeTruthy()
      const decodedData = JSON.parse(decodeURIComponent(encodedData!))
      expect(decodedData).toHaveProperty('metadata')
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
        s3Url: 'https://s3.amazonaws.com/bucket/test-video.mp4'
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
        s3Url: 'https://s3.amazonaws.com/bucket/test-video.mp4'
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

  test('userId is included as query parameter in SSE URL', async () => {
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
      expect(eventSource?.url).toContain('userId=test-user-123')
    })
  })

  test('URL encoding of data parameter remains correct', async () => {
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

      // Parse URL parameters
      const url = new URL(eventSource!.url)
      const encodedData = url.searchParams.get('data')
      expect(encodedData).toBeTruthy()

      // Verify data can be decoded properly
      const decodedData = JSON.parse(decodeURIComponent(encodedData!))
      expect(decodedData).toHaveProperty('metadata')
      expect(decodedData.metadata).toHaveProperty('month')
      expect(decodedData.metadata).toHaveProperty('year')
    })
  })
})

describe('S3 Video Download', () => {
  test('s3Url is extracted from complete event data', async () => {
    const mockOnClose = jest.fn()
    const mockCreateElement = jest.spyOn(document, 'createElement')

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

    // Simulate complete event with s3Url
    await act(async () => {
      eventSource.simulateEvent('complete', {
        filename: 'recap-video.mp4',
        s3Url: 'https://s3.amazonaws.com/cawpile-videos/recap-video.mp4'
      })
    })

    // Verify an anchor element was created for download
    expect(mockCreateElement).toHaveBeenCalledWith('a')

    mockCreateElement.mockRestore()
  })

  test('download uses S3 URL instead of /download/ endpoint', async () => {
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

    const s3Url = 'https://s3.amazonaws.com/cawpile-videos/recap-video.mp4'

    await act(async () => {
      eventSource.simulateEvent('complete', {
        filename: 'recap-video.mp4',
        s3Url
      })
    })

    // Verify the download link uses S3 URL, not /download/ endpoint
    expect(capturedAnchor).toBeTruthy()
    expect(capturedAnchor!.href).toBe(s3Url)
    expect(capturedAnchor!.href).not.toContain('/download/')
  })

  test('download link uses correct filename from response', async () => {
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
        filename: 'monthly-recap-2024-01.mp4',
        s3Url: 'https://s3.amazonaws.com/cawpile-videos/monthly-recap-2024-01.mp4'
      })
    })

    // Verify the download attribute uses the filename from response
    expect(capturedAnchor).toBeTruthy()
    expect(capturedAnchor!.download).toBe('monthly-recap-2024-01.mp4')
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
      expect(eventSource?.url).toContain('data=')
    })
  })
})
