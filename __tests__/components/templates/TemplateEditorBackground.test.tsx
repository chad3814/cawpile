/**
 * Tests for Template Editor Background Image UI
 * Task Group 4.1: Editor background image section tests
 */
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import TemplateEditorClient from '@/components/templates/TemplateEditorClient'
import TemplatePreviewPanel from '@/components/templates/TemplatePreviewPanel'
import { DEFAULT_TEMPLATE } from '@/types/video-template'
import type { VideoTemplate } from '@/types/video-template'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock validateTemplateConfig
jest.mock('@/lib/video/validateTemplateConfig', () => ({
  validateTemplateConfig: jest.fn().mockReturnValue({ valid: true, errors: [] }),
}))

// Mock timingCalculation
jest.mock('@/lib/video/timingCalculation', () => ({
  calculateSubTimings: jest.fn(() => ({})),
  assembleFullTimingConfig: jest.fn((totals: Record<string, number>) => totals),
}))

beforeEach(() => {
  mockPush.mockClear()
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

describe('Template Editor Background Image UI', () => {
  test('Colors tab renders a "Background Image" section with file upload input and overlay opacity slider', () => {
    render(<TemplateEditorClient mode="create" />)

    // Colors tab is active by default
    expect(screen.getByTestId('colors-tab-panel')).toBeInTheDocument()

    // Should render the background image section heading
    expect(screen.getByText('Background Image')).toBeInTheDocument()

    // Should render file upload input
    const uploadInput = screen.getByTestId('global-background-upload')
    expect(uploadInput).toBeInTheDocument()
    expect(uploadInput.tagName).toBe('INPUT')
    expect(uploadInput).toHaveAttribute('type', 'file')

    // Should render overlay opacity slider
    const opacitySlider = screen.getByTestId('global-background-opacity')
    expect(opacitySlider).toBeInTheDocument()
    expect(opacitySlider.tagName).toBe('INPUT')
    expect(opacitySlider).toHaveAttribute('type', 'range')
  })

  test('per-sequence tab (Intro) renders a "Background Image" section with upload/preview/remove controls', () => {
    const initialConfig: VideoTemplate = {
      global: {
        backgroundImage: 'https://example.com/global-bg.jpg',
        backgroundOverlayOpacity: 0.5,
      },
      intro: {
        backgroundImage: 'https://example.com/intro-bg.jpg',
        backgroundOverlayOpacity: 0.4,
      },
    }

    render(
      <TemplateEditorClient
        mode="edit"
        initialConfig={initialConfig}
        templateId="tmpl-123"
        initialName="Test"
      />
    )

    // Switch to Intro tab
    fireEvent.click(screen.getByRole('button', { name: 'Intro' }))

    // Should render the background image section
    expect(screen.getByTestId('intro-background-upload')).toBeInTheDocument()
    expect(screen.getByTestId('intro-background-opacity')).toBeInTheDocument()

    // Should show the preview image since intro has a background image
    const preview = screen.getByTestId('intro-background-preview')
    expect(preview).toBeInTheDocument()
    expect(preview.tagName).toBe('IMG')
    expect(preview).toHaveAttribute('src', 'https://example.com/intro-bg.jpg')

    // Should show a remove button
    expect(screen.getByTestId('intro-background-remove')).toBeInTheDocument()
  })

  test('per-sequence section shows "Inheriting from global" indicator when no sequence-specific override is set', () => {
    const initialConfig: VideoTemplate = {
      global: {
        backgroundImage: 'https://example.com/global-bg.jpg',
        backgroundOverlayOpacity: 0.6,
      },
    }

    render(
      <TemplateEditorClient
        mode="edit"
        initialConfig={initialConfig}
        templateId="tmpl-123"
        initialName="Test"
      />
    )

    // Switch to Intro tab
    fireEvent.click(screen.getByRole('button', { name: 'Intro' }))

    // Should show "Inheriting from global" text
    expect(screen.getByText(/Inheriting from global/i)).toBeInTheDocument()
  })

  test('file upload input accepts only image/jpeg, image/png, image/webp', () => {
    render(<TemplateEditorClient mode="create" />)

    const uploadInput = screen.getByTestId('global-background-upload')
    expect(uploadInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
  })

  test('overlay opacity slider dispatches correct action with value between 0 and 1', () => {
    render(<TemplateEditorClient mode="create" />)

    const opacitySlider = screen.getByTestId('global-background-opacity') as HTMLInputElement

    // Default value should be 0.7 (from DEFAULT_TEMPLATE)
    expect(parseFloat(opacitySlider.value)).toBeCloseTo(0.7, 1)

    // Should have correct attributes for 0-1 range
    expect(opacitySlider).toHaveAttribute('min', '0')
    expect(opacitySlider).toHaveAttribute('max', '1')
    expect(opacitySlider).toHaveAttribute('step', '0.05')

    // Change value
    fireEvent.change(opacitySlider, { target: { value: '0.5' } })
    expect(parseFloat(opacitySlider.value)).toBeCloseTo(0.5, 1)
  })

  test('preview panel renders "Backgrounds" section showing thumbnails for sequences with background images', () => {
    const defaultProps = {
      colors: { ...DEFAULT_TEMPLATE.global.colors },
      fonts: { ...DEFAULT_TEMPLATE.global.fonts },
      timingTotals: {
        introTotal: 75,
        bookTotal: 150,
        statsTotal: 120,
        comingSoonTotal: 90,
        outroTotal: 90,
        transitionOverlap: 6,
      },
      layouts: {
        intro: 'centered',
        bookReveal: 'sequential',
        statsReveal: 'stacked',
        comingSoon: 'list',
        outro: 'centered',
      },
      backgroundImages: {
        global: 'https://example.com/global-bg.jpg',
        intro: 'https://example.com/intro-bg.jpg',
        bookReveal: null,
        statsReveal: null,
        comingSoon: null,
        outro: null,
      },
      backgroundOpacities: {
        global: 0.5,
        intro: 0.3,
        bookReveal: 0.5,
        statsReveal: 0.5,
        comingSoon: 0.5,
        outro: 0.5,
      },
    }

    render(<TemplatePreviewPanel {...defaultProps} />)

    // The "Backgrounds" heading exists both in color groups and the new section.
    // Use getAllByText to confirm both exist, and check for the preview-bg data-testid.
    const backgroundsHeadings = screen.getAllByText('Backgrounds')
    // Should have at least 2: one from color group, one from the new backgrounds section
    expect(backgroundsHeadings.length).toBeGreaterThanOrEqual(2)

    // Should show thumbnail for intro (which has an explicit image)
    const introThumb = screen.getByTestId('preview-bg-intro')
    expect(introThumb).toBeInTheDocument()
  })
})
