/**
 * Tests for TemplateBrowseClient admin behavior
 * Task Group 2.1: Browse page admin controls tests
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
    isPublished: true,
  },
  {
    id: 'tmpl-2',
    name: 'Template Beta',
    previewThumbnailUrl: null,
    config: { global: { colors: { accent: '#ff0000' } } },
    creator: null,
    isPublished: false,
  },
]

beforeEach(() => {
  global.fetch = jest.fn((url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url

    if (urlStr.includes('/api/user/templates/mine')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ templates: [] }),
      })
    }

    if (urlStr.includes('/api/templates') && !urlStr.includes('/api/user/templates')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          templates: mockTemplates,
          totalCount: 2,
        }),
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

describe('TemplateBrowseClient - Admin Controls', () => {
  test('renders "Create New Template" button when isAdmin is true', async () => {
    await act(async () => {
      render(
        <TemplateBrowseClient selectedTemplateId={null} isAdmin={true} />
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Create New Template')).toBeInTheDocument()
    })

    // Verify it links to the create page
    const createLink = screen.getByText('Create New Template').closest('a')
    expect(createLink).toHaveAttribute('href', '/dashboard/templates/create')
  })

  test('"Create New Template" button is not rendered when isAdmin is false or absent', async () => {
    // Test with isAdmin=false
    await act(async () => {
      render(
        <TemplateBrowseClient selectedTemplateId={null} isAdmin={false} />
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Template Gallery')).toBeInTheDocument()
    })

    expect(screen.queryByText('Create New Template')).not.toBeInTheDocument()
  })

  test('admin users see Edit and Delete action buttons on each template card', async () => {
    await act(async () => {
      render(
        <TemplateBrowseClient selectedTemplateId={null} isAdmin={true} />
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Template Alpha')).toBeInTheDocument()
    })

    // Should see edit and delete buttons
    const editButtons = screen.getAllByTestId('template-edit-btn')
    expect(editButtons.length).toBeGreaterThanOrEqual(1)

    const deleteButtons = screen.getAllByTestId('template-delete-btn')
    expect(deleteButtons.length).toBeGreaterThanOrEqual(1)
  })

  test('Delete button triggers a confirmation dialog before proceeding', async () => {
    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

    await act(async () => {
      render(
        <TemplateBrowseClient selectedTemplateId={null} isAdmin={true} />
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Template Alpha')).toBeInTheDocument()
    })

    // Click the first delete button
    const deleteButtons = screen.getAllByTestId('template-delete-btn')
    await act(async () => {
      fireEvent.click(deleteButtons[0])
    })

    // Confirm dialog should have been triggered
    expect(confirmSpy).toHaveBeenCalled()

    confirmSpy.mockRestore()
  })
})
