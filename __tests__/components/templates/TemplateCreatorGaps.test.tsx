/**
 * Strategic gap-fill tests for the Template Creator UI feature
 * Task Group 6.3: Up to 10 additional tests covering critical workflow gaps
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import TemplateEditorClient from '@/components/templates/TemplateEditorClient'
import { DEFAULT_TEMPLATE } from '@/types/video-template'

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

let fetchMock: jest.Mock

beforeEach(() => {
  mockPush.mockClear()
  mockValidate.mockClear()
  mockValidate.mockReturnValue({ valid: true, errors: [] })
  fetchMock = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ template: { id: 'new-id' } }),
    })
  ) as jest.Mock
  global.fetch = fetchMock
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('Template Creator - Gap Fill Tests', () => {
  test('full create flow: save calls POST /api/templates with correct payload structure', async () => {
    render(<TemplateEditorClient mode="create" />)

    // Fill in name
    fireEvent.change(screen.getByTestId('template-name-input'), {
      target: { value: 'My New Template' },
    })

    // Fill in description
    fireEvent.change(screen.getByTestId('template-description-input'), {
      target: { value: 'A custom template' },
    })

    // Click save
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-template-btn'))
    })

    // Verify POST request was made to the correct endpoint
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/templates',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )

    // Parse the request body to verify structure
    const callArgs = fetchMock.mock.calls[0]
    const body = JSON.parse(callArgs[1].body)

    expect(body.name).toBe('My New Template')
    expect(body.description).toBe('A custom template')
    expect(body.isPublished).toBe(false)
    expect(body.config).toBeDefined()
    expect(body.config.global).toBeDefined()
    expect(body.config.global.colors).toBeDefined()
    expect(body.config.global.fonts).toBeDefined()
    expect(body.config.global.timing).toBeDefined()
    expect(body.config.intro).toBeDefined()
    expect(body.config.bookReveal).toBeDefined()
    expect(body.config.statsReveal).toBeDefined()
    expect(body.config.comingSoon).toBeDefined()
    expect(body.config.outro).toBeDefined()

    // On success, should redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/templates')
    })
  })

  test('full edit flow: save calls PATCH /api/templates/[id] with correct endpoint', async () => {
    render(
      <TemplateEditorClient
        mode="edit"
        templateId="tmpl-edit-123"
        initialName="Existing Template"
      />
    )

    // Modify the name
    fireEvent.change(screen.getByTestId('template-name-input'), {
      target: { value: 'Updated Template Name' },
    })

    // Click save
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-template-btn'))
    })

    // Verify PATCH request was made to the correct endpoint
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/templates/tmpl-edit-123',
      expect.objectContaining({
        method: 'PATCH',
      })
    )

    const callArgs = fetchMock.mock.calls[0]
    const body = JSON.parse(callArgs[1].body)
    expect(body.name).toBe('Updated Template Name')
  })

  test('color input bidirectional sync: changing hex text input updates the color value', () => {
    render(<TemplateEditorClient mode="create" />)

    // The Colors tab is active by default
    const accentTextInput = screen.getByTestId('color-text-accent') as HTMLInputElement

    // Verify default value
    expect(accentTextInput.value).toBe(DEFAULT_TEMPLATE.global.colors.accent)

    // Change the hex text input
    fireEvent.change(accentTextInput, { target: { value: '#00ff00' } })

    // Verify the text input updated
    expect(accentTextInput.value).toBe('#00ff00')

    // Verify the preview panel swatch updated reactively
    const previewSwatch = screen.getByTestId('preview-swatch-accent').querySelector('div')
    expect(previewSwatch).toHaveStyle({ backgroundColor: '#00ff00' })
  })

  test('Delete button is NOT shown in create mode', () => {
    render(<TemplateEditorClient mode="create" />)

    // Delete button should not exist in create mode
    expect(screen.queryByTestId('delete-template-btn')).not.toBeInTheDocument()
  })

  test('config assembly includes computed sub-timings from timing totals', async () => {
    render(<TemplateEditorClient mode="create" />)

    // Fill in name
    fireEvent.change(screen.getByTestId('template-name-input'), {
      target: { value: 'Timing Test' },
    })

    // Click save to trigger config assembly
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-template-btn'))
    })

    // The validate function receives the assembled config
    expect(mockValidate).toHaveBeenCalledTimes(1)
    const config = mockValidate.mock.calls[0][0]

    // Verify timing sub-timings were computed (not just totals)
    expect(config.global.timing.introFadeIn).toBeDefined()
    expect(config.global.timing.introHold).toBeDefined()
    expect(config.global.timing.introFadeOut).toBeDefined()
    expect(config.global.timing.introTotal).toBe(DEFAULT_TEMPLATE.global.timing.introTotal)

    // Verify sub-timings sum to the total for intro
    const introSum = config.global.timing.introFadeIn +
      config.global.timing.introHold +
      config.global.timing.introFadeOut
    expect(introSum).toBe(config.global.timing.introTotal)

    // Verify all 23 timing properties exist
    expect(Object.keys(config.global.timing)).toHaveLength(23)
  })

  test('API error handling: save fails and error is displayed inline without losing form state', async () => {
    // Make the API return an error
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error: duplicate name' }),
    })

    render(<TemplateEditorClient mode="create" />)

    // Fill in name
    fireEvent.change(screen.getByTestId('template-name-input'), {
      target: { value: 'Duplicate Name' },
    })

    // Click save
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-template-btn'))
    })

    // Error should be displayed inline
    await waitFor(() => {
      expect(screen.getByText('Server error: duplicate name')).toBeInTheDocument()
    })

    // Form state should be preserved (name should still have the value)
    const nameInput = screen.getByTestId('template-name-input') as HTMLInputElement
    expect(nameInput.value).toBe('Duplicate Name')

    // Should NOT have redirected
    expect(mockPush).not.toHaveBeenCalled()
  })

  test('template name is required: empty name prevents save', async () => {
    render(<TemplateEditorClient mode="create" />)

    // Leave name empty and click save
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-template-btn'))
    })

    // Should show error about name being required
    await waitFor(() => {
      expect(screen.getByText('Template name is required.')).toBeInTheDocument()
    })

    // validate should NOT have been called (early return before validation)
    expect(mockValidate).not.toHaveBeenCalled()

    // fetch should NOT have been called
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test('isPublished toggle correctly sends true/false in save payload', async () => {
    render(<TemplateEditorClient mode="create" />)

    // Fill in name
    fireEvent.change(screen.getByTestId('template-name-input'), {
      target: { value: 'Published Test' },
    })

    // Toggle isPublished ON
    const publishToggle = screen.getByTestId('template-isPublished-toggle')
    fireEvent.click(publishToggle)

    // Save
    await act(async () => {
      fireEvent.click(screen.getByTestId('save-template-btn'))
    })

    // Verify the payload includes isPublished: true
    const callArgs = fetchMock.mock.calls[0]
    const body = JSON.parse(callArgs[1].body)
    expect(body.isPublished).toBe(true)
  })

  test('delete confirmation declined does NOT call DELETE API', async () => {
    // Mock window.confirm to return false (user declines)
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

    render(
      <TemplateEditorClient
        mode="edit"
        templateId="tmpl-keep"
        initialName="Keep This"
      />
    )

    // Click delete
    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-template-btn'))
    })

    // Confirm was called
    expect(confirmSpy).toHaveBeenCalled()

    // But fetch should NOT have been called (user declined)
    expect(fetchMock).not.toHaveBeenCalled()

    // Should NOT redirect
    expect(mockPush).not.toHaveBeenCalled()

    confirmSpy.mockRestore()
  })

  test('changing a timing total in the editor updates the preview panel timing bar', () => {
    render(<TemplateEditorClient mode="create" />)

    // Switch to Timing tab
    fireEvent.click(screen.getByRole('button', { name: 'Timing' }))

    // Change the intro total from default (75) to 300
    const introInput = screen.getByTestId('timing-introTotal') as HTMLInputElement
    fireEvent.change(introInput, { target: { value: '300' } })

    // The preview panel timing label should reflect the change
    const introLabel = screen.getByTestId('preview-timing-label-intro')
    expect(introLabel).toHaveTextContent('Intro: 300f (10.0s)')
  })
})
