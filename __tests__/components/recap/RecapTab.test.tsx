/**
 * Tests for RecapTab component
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RecapTab } from '@/components/recap/RecapTab'

const mockSession = {
  data: {
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
    expires: '2099-12-31T23:59:59.999Z',
  },
  status: 'authenticated' as const,
}

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => mockSession),
}))

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = []
  url: string
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  readyState: number = 0
  listeners: Record<string, ((event: MessageEvent) => void)[]> = {}

  constructor(url: string) {
    this.url = url
    MockEventSource.instances.push(this)
    setTimeout(() => {
      this.readyState = 1
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
    this.readyState = 2
  }

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

const mockPreviewResponse = {
  monthName: 'March',
  year: 2026,
  month: 3,
  bookCount: 5,
  completedCount: 4,
  dnfCount: 1,
}

const mockEmptyPreviewResponse = {
  monthName: 'February',
  year: 2026,
  month: 2,
  bookCount: 0,
  completedCount: 0,
  dnfCount: 0,
}

const mockExportData = {
  metadata: { month: 3, year: 2026, monthName: 'March' },
  summary: { totalBooks: 5 },
  books: [],
}

// Mock URL.createObjectURL / revokeObjectURL for jsdom
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  MockEventSource.clearInstances()

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

describe('RecapTab', () => {
  it('renders the heading and selectors', async () => {
    render(<RecapTab />)

    expect(screen.getByText('Monthly Reading Recap')).toBeInTheDocument()
    expect(screen.getByLabelText('Month')).toBeInTheDocument()
    expect(screen.getByLabelText('Year')).toBeInTheDocument()
  })

  it('fetches and displays preview data on mount', async () => {
    render(<RecapTab />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })
    expect(screen.getByText(/books finished/)).toBeInTheDocument()
    expect(screen.getByText('4 completed')).toBeInTheDocument()
    expect(screen.getByText('1 DNF')).toBeInTheDocument()
  })

  it('re-fetches preview when month changes', async () => {
    render(<RecapTab />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    const monthSelect = screen.getByLabelText('Month')
    fireEvent.change(monthSelect, { target: { value: '1' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('month=1')
      )
    })
  })

  it('disables action buttons when no books', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/recap/monthly') && url.includes('preview=true')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmptyPreviewResponse),
        })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })

    render(<RecapTab />)

    await waitFor(() => {
      expect(screen.getByText('No books finished this month')).toBeInTheDocument()
    })

    expect(screen.getByText('Generate TikTok Video').closest('button')).toBeDisabled()
    expect(screen.getByText('Export JSON Data').closest('button')).toBeDisabled()
  })

  it('enables action buttons when books exist', async () => {
    render(<RecapTab />)

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    expect(screen.getByText('Generate TikTok Video').closest('button')).not.toBeDisabled()
    expect(screen.getByText('Export JSON Data').closest('button')).not.toBeDisabled()
  })

  it('shows error state when preview fetch fails', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/recap/monthly') && url.includes('preview=true')) {
        return Promise.resolve({ ok: false, status: 500 })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    })

    render(<RecapTab />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load preview')).toBeInTheDocument()
    })
  })

  it('renders help text', () => {
    render(<RecapTab />)

    expect(
      screen.getByText(/Generate a TikTok-style video/)
    ).toBeInTheDocument()
  })
})

describe('RecapTab state reset on selector change', () => {
  it('clears stale export data and status banners when month changes', async () => {
    await act(async () => {
      render(<RecapTab />)
    })

    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // Export JSON to set renderStatus to 'success'
    const exportButton = screen.getByRole('button', { name: /Export JSON Data/i })
    await act(async () => {
      fireEvent.click(exportButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Export completed successfully!')).toBeInTheDocument()
    })

    // Change month — banner should disappear
    const monthSelect = screen.getByLabelText('Month')
    await act(async () => {
      fireEvent.change(monthSelect, { target: { value: '1' } })
    })

    await waitFor(() => {
      expect(screen.queryByText('Export completed successfully!')).not.toBeInTheDocument()
    })
  })
})

describe('RecapTab JSON export', () => {
  it('triggers download and sets success status', async () => {
    await act(async () => {
      render(<RecapTab />)
    })

    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    const exportButton = screen.getByRole('button', { name: /Export JSON Data/i })
    await act(async () => {
      fireEvent.click(exportButton)
    })

    await waitFor(() => {
      expect(screen.getByText('Export completed successfully!')).toBeInTheDocument()
    })

    // Verify the full recap data was fetched (not preview)
    const fetchMock = global.fetch as jest.Mock
    const fullDataCall = fetchMock.mock.calls.find(
      ([url]: [string]) =>
        (url as string).includes('/api/recap/monthly') && !(url as string).includes('preview=true')
    )
    expect(fullDataCall).toBeDefined()
  })
})

describe('RecapTab video generation SSE', () => {
  it('shows progress bar during video rendering', async () => {
    await act(async () => {
      render(<RecapTab />)
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
      eventSource.simulateEvent('progress', { progress: 45 })
    })

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument()
      expect(screen.getByTestId('render-progress-bar')).toBeInTheDocument()
    })

    const progressFill = screen.getByTestId('render-progress-fill')
    expect(progressFill).toHaveStyle({ width: '45%' })
  })

  it('shows success on complete event', async () => {
    await act(async () => {
      render(<RecapTab />)
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
        filename: 'test-video.mp4',
        s3Url: 'https://cawpile-videos.s3.us-east-2.amazonaws.com/test-video.mp4',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Export completed successfully!')).toBeInTheDocument()
    })

    expect(eventSource.readyState).toBe(2)
  })

  it('shows error on SSE error event', async () => {
    await act(async () => {
      render(<RecapTab />)
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
      eventSource.simulateEvent('error', { message: 'Render failed: out of memory' })
    })

    await waitFor(() => {
      expect(screen.getByText('Render failed: out of memory')).toBeInTheDocument()
    })

    expect(eventSource.readyState).toBe(2)
  })

  it('shows error on connection drop', async () => {
    await act(async () => {
      render(<RecapTab />)
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
      eventSource.simulateError()
    })

    await waitFor(() => {
      expect(screen.getByText('Connection to render server lost')).toBeInTheDocument()
    })

    expect(eventSource.readyState).toBe(2)
  })

  it('reuses cached exportData on second generate call', async () => {
    await act(async () => {
      render(<RecapTab />)
    })

    await waitFor(() => {
      expect(screen.getByText(/books finished/i)).toBeInTheDocument()
    })

    // First generate — fetches full data
    const generateButton = screen.getByRole('button', { name: /Generate TikTok Video/i })
    await act(async () => {
      fireEvent.click(generateButton)
    })

    await waitFor(() => {
      expect(MockEventSource.getLastInstance()).toBeDefined()
    })

    // Complete first render
    await act(async () => {
      MockEventSource.getLastInstance()!.simulateEvent('complete', {
        filename: 'test.mp4',
        s3Url: 'https://example.com/test.mp4',
      })
    })

    const fetchCountAfterFirst = (global.fetch as jest.Mock).mock.calls.filter(
      ([url]: [string]) =>
        (url as string).includes('/api/recap/monthly') && !(url as string).includes('preview=true')
    ).length

    // Second generate — should reuse cached data
    await act(async () => {
      fireEvent.click(generateButton)
    })

    await waitFor(() => {
      expect(MockEventSource.instances.length).toBe(2)
    })

    const fetchCountAfterSecond = (global.fetch as jest.Mock).mock.calls.filter(
      ([url]: [string]) =>
        (url as string).includes('/api/recap/monthly') && !(url as string).includes('preview=true')
    ).length

    // Should not have fetched again
    expect(fetchCountAfterSecond).toBe(fetchCountAfterFirst)
  })
})
