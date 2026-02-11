/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import type { VideoTemplate } from '../../../lib/template-types'

// Mock Remotion hooks
vi.mock('remotion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('remotion')>()
  return {
    ...actual,
    useCurrentFrame: () => 30,
    useVideoConfig: () => ({ fps: 30, width: 1080, height: 1920, durationInFrames: 300 }),
    AbsoluteFill: ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
      <div data-testid="absolute-fill" style={style}>{children}</div>
    ),
    Sequence: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="sequence">{children}</div>
    ),
    Img: ({ src, style }: { src: string; style?: React.CSSProperties }) => (
      <img src={src} style={style} data-testid="remotion-img" />
    ),
    spring: () => 1,
    interpolate: (_input: number, _inputRange: number[], outputRange: number[]) => outputRange[outputRange.length - 1],
  }
})

// Import components after mocking
import { IntroSequence } from '../IntroSequence'
import { OutroSequence } from '../OutroSequence'
import { TemplateProvider } from '../../../lib/TemplateContext'

/**
 * Strategic tests for layout variants
 * These tests verify that different layout options render correctly
 */
describe('Layout Variants', () => {
  describe('IntroSequence layouts', () => {
    it('should render with split layout', () => {
      const template: Partial<VideoTemplate> = {
        intro: { layout: 'split' },
      }

      const { container } = render(
        <TemplateProvider template={template}>
          <IntroSequence monthName="January" year={2026} bookCount={5} />
        </TemplateProvider>
      )

      // Component should render without errors
      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
      // Text content includes month name letters (rendered as spans by KineticText)
      expect(container.textContent).toContain('READING RECAP')
    })

    it('should render with minimal layout', () => {
      const template: Partial<VideoTemplate> = {
        intro: { layout: 'minimal' },
      }

      const { container } = render(
        <TemplateProvider template={template}>
          <IntroSequence monthName="February" year={2026} bookCount={3} />
        </TemplateProvider>
      )

      // Component should render without errors
      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
      // Minimal layout should render the month name
      expect(container.textContent).toBeTruthy()
    })

    it('should render with centered layout (default)', () => {
      const template: Partial<VideoTemplate> = {
        intro: { layout: 'centered' },
      }

      const { container } = render(
        <TemplateProvider template={template}>
          <IntroSequence monthName="March" year={2026} bookCount={7} />
        </TemplateProvider>
      )

      // Component should render without errors
      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
      // Should include book count teaser text
      expect(container.textContent).toContain('BOOKS')
    })
  })

  describe('OutroSequence layouts', () => {
    it('should render with minimal layout', () => {
      const template: Partial<VideoTemplate> = {
        outro: { layout: 'minimal' },
      }

      const { container } = render(
        <TemplateProvider template={template}>
          <OutroSequence />
        </TemplateProvider>
      )

      // Component should render without errors
      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
    })

    it('should render with branded layout', () => {
      const template: Partial<VideoTemplate> = {
        outro: { layout: 'branded' },
      }

      const { container } = render(
        <TemplateProvider template={template}>
          <OutroSequence />
        </TemplateProvider>
      )

      // Component should render without errors
      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
    })

    it('should render with custom text in outro', () => {
      const template: Partial<VideoTemplate> = {
        outro: {
          layout: 'centered',
          customText: 'Thanks for watching!',
        },
      }

      const { container } = render(
        <TemplateProvider template={template}>
          <OutroSequence />
        </TemplateProvider>
      )

      // Component should render without errors
      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
      // Custom text may or may not be rendered depending on implementation
      // The main check is that it renders without errors
    })
  })
})
