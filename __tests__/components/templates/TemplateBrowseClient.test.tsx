/**
 * Tests for TemplateBrowseClient component
 * Task Group 4.1: Browse page UI component tests
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import TemplateBrowseClient from '@/components/templates/TemplateBrowseClient'

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// Mock useDebounce to return value immediately for testing
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}))

const mockTemplates = [
  {
    id: 'tmpl-1',
    name: 'Template Alpha',
    previewThumbnailUrl: null,
    config: { global: { colors: { background: '#000' } } },
    creator: { name: 'Admin', image: null },
  },
  {
    id: 'tmpl-2',
    name: 'Template Beta',
    previewThumbnailUrl: null,
    config: { global: { colors: { accent: '#ff0000' } } },
    creator: null,
  },
]

// Track fetch calls for assertions
let fetchCalls: string[] = []

beforeEach(() => {
  fetchCalls = []
  global.fetch = jest.fn((url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url
    fetchCalls.push(urlStr)

    if (urlStr.includes('/api/user/templates/mine')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ templates: [] }),
      })
    }

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        templates: mockTemplates,
        totalCount: 2,
        selectedTemplateId: null,
      }),
    })
  }) as jest.Mock
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('TemplateBrowseClient', () => {
  test('renders grid of cards and handles empty state', async () => {
    await act(async () => {
      render(<TemplateBrowseClient selectedTemplateId={null} userId="user-1" />)
    })

    // Should render both template cards
    await waitFor(() => {
      expect(screen.getByText('Template Alpha')).toBeInTheDocument()
      expect(screen.getByText('Template Beta')).toBeInTheDocument()
    })

    // Now test empty state
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/mine')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ templates: [] }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          templates: [],
          totalCount: 0,
          selectedTemplateId: null,
        }),
      })
    })

    // Re-render to get empty state
    const { unmount } = render(<TemplateBrowseClient selectedTemplateId={null} userId="user-1" />)

    await waitFor(() => {
      const emptyStates = screen.getAllByTestId('empty-state')
      expect(emptyStates.length).toBeGreaterThan(0)
    })

    unmount()
  })

  test('search input triggers debounced API refetch', async () => {
    await act(async () => {
      render(<TemplateBrowseClient selectedTemplateId={null} userId="user-1" />)
    })

    // Wait for initial fetches to complete
    await waitFor(() => {
      expect(screen.getByText('Template Alpha')).toBeInTheDocument()
    })

    // Clear fetch tracking
    fetchCalls = []

    // Type in search input
    const searchInput = screen.getByTestId('template-search')
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'sunset' } })
    })

    // Since useDebounce is mocked to return immediately, the fetch should fire
    await waitFor(() => {
      const browseFetches = fetchCalls.filter((url) => url.includes('/api/user/templates?'))
      expect(browseFetches.length).toBeGreaterThan(0)
      // Verify the search parameter was included
      const lastFetch = browseFetches[browseFetches.length - 1]
      expect(lastFetch).toContain('search=sunset')
    })
  })
})
