/**
 * Tests for TemplateEditorClient component
 * Task Group 3.1: Core tabbed editor component tests
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import TemplateEditorClient from '@/components/templates/TemplateEditorClient'
import { DEFAULT_TEMPLATE } from '@/types/video-template'
import type { VideoTemplate } from '@/types/video-template'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock validateTemplateConfig
const mockValidate = jest.fn()
jest.mock('@/lib/video/validateTemplateConfig', () => ({
  validateTemplateConfig: (...args: unknown[]) => mockValidate(...args),
}))

beforeEach(() => {
  mockPush.mockClear()
  mockValidate.mockClear()
  mockValidate.mockReturnValue({ valid: true, errors: [] })
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ template: { id: 'new-id' } }),
    })
  ) as jest.Mock
})

afterEach(() => {
  jest.restoreAllMocks()
})

const TAB_LABELS = ['Colors', 'Fonts', 'Timing', 'Intro', 'Book Reveal', 'Stats Reveal', 'Coming Soon', 'Outro']

describe('TemplateEditorClient', () => {
  test('renders all 8 tab buttons', () => {
    render(<TemplateEditorClient mode="create" />)

    for (const label of TAB_LABELS) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  test('clicking a tab switches the visible panel content', () => {
    render(<TemplateEditorClient mode="create" />)

    // Initially Colors tab is active - should see color tab panel with test id
    expect(screen.getByTestId('colors-tab-panel')).toBeInTheDocument()

    // Click Fonts tab
    fireEvent.click(screen.getByRole('button', { name: 'Fonts' }))
    expect(screen.getByText('Heading Font')).toBeInTheDocument()

    // Click Timing tab
    fireEvent.click(screen.getByRole('button', { name: 'Timing' }))
    expect(screen.getByText('Intro Total')).toBeInTheDocument()

    // Click Intro tab
    fireEvent.click(screen.getByRole('button', { name: 'Intro' }))
    expect(screen.getByText('Intro Layout')).toBeInTheDocument()
  })

  test('"create" mode pre-populates all fields with DEFAULT_TEMPLATE values', () => {
    render(<TemplateEditorClient mode="create" />)

    // Check the name field is empty (no initial name)
    const nameInput = screen.getByTestId('template-name-input') as HTMLInputElement
    expect(nameInput.value).toBe('')

    // Switch to Fonts tab and check default heading font
    fireEvent.click(screen.getByRole('button', { name: 'Fonts' }))
    const headingInput = screen.getByTestId('font-heading-input') as HTMLInputElement
    expect(headingInput.value).toBe(DEFAULT_TEMPLATE.global.fonts.heading)

    // Switch to Intro tab and check default layout
    fireEvent.click(screen.getByRole('button', { name: 'Intro' }))
    const layoutSelect = screen.getByTestId('intro-layout-select') as HTMLSelectElement
    expect(layoutSelect.value).toBe(DEFAULT_TEMPLATE.intro.layout)
  })

  test('"edit" mode pre-populates fields from a provided initial config', () => {
    const initialConfig: VideoTemplate = {
      global: {
        colors: { accent: '#ff0000' },
        fonts: { heading: 'Custom Font, serif' },
      },
      intro: { layout: 'minimal' },
    }

    render(
      <TemplateEditorClient
        mode="edit"
        initialConfig={initialConfig}
        templateId="tmpl-123"
        initialName="My Custom Template"
        initialDescription="A test template"
      />
    )

    // Check the name field is pre-populated
    const nameInput = screen.getByTestId('template-name-input') as HTMLInputElement
    expect(nameInput.value).toBe('My Custom Template')

    // Check description
    const descInput = screen.getByTestId('template-description-input') as HTMLTextAreaElement
    expect(descInput.value).toBe('A test template')

    // Switch to Fonts and check custom heading value
    fireEvent.click(screen.getByRole('button', { name: 'Fonts' }))
    const headingInput = screen.getByTestId('font-heading-input') as HTMLInputElement
    expect(headingInput.value).toBe('Custom Font, serif')

    // Switch to Intro tab and check the custom layout
    fireEvent.click(screen.getByRole('button', { name: 'Intro' }))
    const layoutSelect = screen.getByTestId('intro-layout-select') as HTMLSelectElement
    expect(layoutSelect.value).toBe('minimal')
  })

  test('save button calls validateTemplateConfig before submission', async () => {
    mockValidate.mockReturnValue({ valid: true, errors: [] })

    render(<TemplateEditorClient mode="create" />)

    // Fill in required name field
    const nameInput = screen.getByTestId('template-name-input')
    fireEvent.change(nameInput, { target: { value: 'Test Template' } })

    // Click save
    const saveButton = screen.getByTestId('save-template-btn')
    await act(async () => {
      fireEvent.click(saveButton)
    })

    // Validate should have been called
    expect(mockValidate).toHaveBeenCalledTimes(1)
    // It should be called with an object matching the VideoTemplate structure
    expect(mockValidate).toHaveBeenCalledWith(
      expect.objectContaining({
        global: expect.objectContaining({
          colors: expect.any(Object),
          fonts: expect.any(Object),
          timing: expect.any(Object),
        }),
      })
    )
  })

  test('validation errors display inline and switch to the tab containing the first error', async () => {
    // Return a validation error on the intro section
    mockValidate.mockReturnValue({
      valid: false,
      errors: [
        {
          path: 'intro.layout',
          message: 'Invalid layout value',
          value: 'invalid',
        },
      ],
    })

    render(<TemplateEditorClient mode="create" />)

    // Fill in name
    const nameInput = screen.getByTestId('template-name-input')
    fireEvent.change(nameInput, { target: { value: 'Test Template' } })

    // Click save
    const saveButton = screen.getByTestId('save-template-btn')
    await act(async () => {
      fireEvent.click(saveButton)
    })

    // Should display the validation error
    await waitFor(() => {
      expect(screen.getByText(/Invalid layout value/)).toBeInTheDocument()
    })

    // Should switch to the Intro tab (the tab containing the error)
    // The intro tab should now be active
    const introTab = screen.getByRole('button', { name: 'Intro' })
    expect(introTab.className).toContain('border-primary')
  })
})
