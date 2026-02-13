/**
 * Tests for TemplateDetailClient component
 * Task Group 5.1: Template detail page tests
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import TemplateDetailClient from '@/components/templates/TemplateDetailClient'

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

const mockTemplate = {
  id: 'tmpl-detail-1',
  name: 'Cozy Reader Theme',
  description: 'A warm and inviting template perfect for cozy reading vibes.',
  previewThumbnailUrl: 'https://example.com/preview.jpg',
  config: {
    global: {
      colors: {
        background: '#1a1a2e',
        accent: '#e94560',
        textPrimary: '#ffffff',
        accentSecondary: '#0f3460',
        backgroundSecondary: '#16213e',
        textSecondary: '#cccccc',
      },
      fonts: {
        heading: 'Inter',
        body: 'Roboto',
        mono: 'Fira Code',
      },
    },
    intro: { layout: 'centered' },
    bookReveal: { layout: 'sequential' },
    statsReveal: { layout: 'stacked' },
    comingSoon: { layout: 'list' },
    outro: { layout: 'minimal' },
  },
  creator: {
    name: 'Jane Admin',
    image: 'https://example.com/avatar.jpg',
  },
}

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, selectedTemplateId: mockTemplate.id }),
    })
  ) as jest.Mock
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('TemplateDetailClient', () => {
  test('renders template name, description, creator info, and color palette', () => {
    render(
      <TemplateDetailClient
        template={mockTemplate}
        selectedTemplateId={null}
      />
    )

    // Template name and description
    expect(screen.getByText('Cozy Reader Theme')).toBeInTheDocument()
    expect(screen.getByText('A warm and inviting template perfect for cozy reading vibes.')).toBeInTheDocument()

    // Creator info
    expect(screen.getByText('Jane Admin')).toBeInTheDocument()

    // Color palette - check for labeled swatches
    expect(screen.getByText('Background')).toBeInTheDocument()
    expect(screen.getByText('Accent')).toBeInTheDocument()
    expect(screen.getByText('Text Primary')).toBeInTheDocument()

    // Font info
    expect(screen.getByText('Inter')).toBeInTheDocument()
    expect(screen.getByText('Roboto')).toBeInTheDocument()
    expect(screen.getByText('Fira Code')).toBeInTheDocument()

    // Layout info
    expect(screen.getByText('centered')).toBeInTheDocument()
    expect(screen.getByText('sequential')).toBeInTheDocument()
    expect(screen.getByText('stacked')).toBeInTheDocument()
  })

  test('"Select for My Recap" button calls the select API and updates UI state', async () => {
    render(
      <TemplateDetailClient
        template={mockTemplate}
        selectedTemplateId={null}
      />
    )

    const selectButton = screen.getByText('Select for My Recap')
    expect(selectButton).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(selectButton)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/user/templates/${mockTemplate.id}/select`,
        expect.objectContaining({ method: 'POST' })
      )
    })

    // After success, should show "Currently Selected" state
    await waitFor(() => {
      expect(screen.getByText('Currently Selected')).toBeInTheDocument()
    })
  })

  test('"Duplicate" button calls the duplicate API and shows success confirmation', async () => {
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/duplicate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ template: { id: 'tmpl-copy-1', name: 'Copy of Cozy Reader Theme' } }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    })

    render(
      <TemplateDetailClient
        template={mockTemplate}
        selectedTemplateId={null}
      />
    )

    const duplicateButton = screen.getByText('Duplicate')
    expect(duplicateButton).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(duplicateButton)
    })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/user/templates/${mockTemplate.id}/duplicate`,
        expect.objectContaining({ method: 'POST' })
      )
    })

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/Template duplicated/)).toBeInTheDocument()
    })
  })

  test('shows "Currently Selected" state when template is already selected', () => {
    render(
      <TemplateDetailClient
        template={mockTemplate}
        selectedTemplateId={mockTemplate.id}
      />
    )

    expect(screen.getByText('Currently Selected')).toBeInTheDocument()
    expect(screen.queryByText('Select for My Recap')).not.toBeInTheDocument()
  })
})
