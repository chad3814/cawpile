/**
 * Tests for TemplatePreviewPanel component
 * Task Group 4.1: Preview panel tests
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import TemplatePreviewPanel from '@/components/templates/TemplatePreviewPanel'
import { DEFAULT_TEMPLATE } from '@/types/video-template'

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
}

describe('TemplatePreviewPanel', () => {
  test('color swatches update reactively when color config values change', () => {
    const customColors = {
      ...DEFAULT_TEMPLATE.global.colors,
      accent: '#ff0000',
      background: '#123456',
    }

    const { rerender } = render(
      <TemplatePreviewPanel {...defaultProps} colors={defaultProps.colors} />
    )

    // Check default accent color swatch
    const accentSwatch = screen.getByTestId('preview-swatch-accent').querySelector('div')
    expect(accentSwatch).toHaveStyle({ backgroundColor: DEFAULT_TEMPLATE.global.colors.accent })

    // Rerender with updated colors
    rerender(
      <TemplatePreviewPanel {...defaultProps} colors={customColors} />
    )

    // Verify swatches updated
    const updatedAccentSwatch = screen.getByTestId('preview-swatch-accent').querySelector('div')
    expect(updatedAccentSwatch).toHaveStyle({ backgroundColor: '#ff0000' })

    const updatedBgSwatch = screen.getByTestId('preview-swatch-background').querySelector('div')
    expect(updatedBgSwatch).toHaveStyle({ backgroundColor: '#123456' })
  })

  test('font preview samples render with the correct font-family style attribute', () => {
    const customFonts = {
      heading: 'Georgia, serif',
      body: 'Verdana, sans-serif',
      mono: 'Courier New, monospace',
    }

    render(
      <TemplatePreviewPanel {...defaultProps} fonts={customFonts} />
    )

    const headingSample = screen.getByTestId('preview-font-heading')
    expect(headingSample).toHaveStyle({ fontFamily: 'Georgia, serif' })
    expect(headingSample).toHaveTextContent('Heading Sample')

    const bodySample = screen.getByTestId('preview-font-body')
    expect(bodySample).toHaveStyle({ fontFamily: 'Verdana, sans-serif' })
    expect(bodySample).toHaveTextContent('Body text sample')

    const monoSample = screen.getByTestId('preview-font-mono')
    expect(monoSample).toHaveStyle({ fontFamily: 'Courier New, monospace' })
    expect(monoSample).toHaveTextContent('mono sample')
  })

  test('layout summary displays the currently selected layout for each sequence as labeled badges', () => {
    const customLayouts = {
      intro: 'split',
      bookReveal: 'grid',
      statsReveal: 'horizontal',
      comingSoon: 'single',
      outro: 'branded',
    }

    render(
      <TemplatePreviewPanel {...defaultProps} layouts={customLayouts} />
    )

    // Each sequence should display its layout label as a badge
    const introBadge = screen.getByTestId('preview-layout-intro')
    expect(introBadge).toHaveTextContent('Intro:')
    expect(introBadge).toHaveTextContent('split')

    const bookBadge = screen.getByTestId('preview-layout-bookReveal')
    expect(bookBadge).toHaveTextContent('Book Reveal:')
    expect(bookBadge).toHaveTextContent('grid')

    const statsBadge = screen.getByTestId('preview-layout-statsReveal')
    expect(statsBadge).toHaveTextContent('Stats Reveal:')
    expect(statsBadge).toHaveTextContent('horizontal')

    const comingSoonBadge = screen.getByTestId('preview-layout-comingSoon')
    expect(comingSoonBadge).toHaveTextContent('Coming Soon:')
    expect(comingSoonBadge).toHaveTextContent('single')

    const outroBadge = screen.getByTestId('preview-layout-outro')
    expect(outroBadge).toHaveTextContent('Outro:')
    expect(outroBadge).toHaveTextContent('branded')
  })

  test('timing overview displays proportional durations with frame and seconds labels', () => {
    const timingTotals = {
      introTotal: 75,
      bookTotal: 150,
      statsTotal: 120,
      comingSoonTotal: 90,
      outroTotal: 90,
      transitionOverlap: 10,
    }

    render(
      <TemplatePreviewPanel {...defaultProps} timingTotals={timingTotals} />
    )

    // Verify the timing bar exists
    const timingBar = screen.getByTestId('preview-timing-bar')
    expect(timingBar).toBeInTheDocument()

    // Verify timing labels show frames and seconds
    const introLabel = screen.getByTestId('preview-timing-label-intro')
    expect(introLabel).toHaveTextContent('Intro: 75f (2.5s)')

    const bookLabel = screen.getByTestId('preview-timing-label-book')
    expect(bookLabel).toHaveTextContent('Book: 150f (5.0s)')

    const statsLabel = screen.getByTestId('preview-timing-label-stats')
    expect(statsLabel).toHaveTextContent('Stats: 120f (4.0s)')

    const soonLabel = screen.getByTestId('preview-timing-label-soon')
    expect(soonLabel).toHaveTextContent('Soon: 90f (3.0s)')

    const outroLabel = screen.getByTestId('preview-timing-label-outro')
    expect(outroLabel).toHaveTextContent('Outro: 90f (3.0s)')

    // Verify overlap is displayed
    const overlap = screen.getByTestId('preview-timing-overlap')
    expect(overlap).toHaveTextContent('Overlap: 10 frames')

    // Verify proportional widths: total is 525 frames
    // Intro: 75/525 = ~14.3%
    const introSegment = screen.getByTestId('preview-timing-segment-intro')
    const introWidth = introSegment.style.width
    expect(parseFloat(introWidth)).toBeCloseTo(14.3, 0)

    // Book: 150/525 = ~28.6%
    const bookSegment = screen.getByTestId('preview-timing-segment-book')
    const bookWidth = bookSegment.style.width
    expect(parseFloat(bookWidth)).toBeCloseTo(28.6, 0)
  })
})
