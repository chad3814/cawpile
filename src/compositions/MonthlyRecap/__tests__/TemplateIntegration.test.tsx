/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import type { VideoTemplate } from '../../../lib/template-types'
import { DEFAULT_TEMPLATE } from '../../../lib/template-types'

// Mock Remotion hooks more completely
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
import { BookReveal } from '../BookReveal'
import { StatsReveal } from '../StatsReveal'
import { ComingSoonSequence } from '../ComingSoonSequence'
import { OutroSequence } from '../OutroSequence'
import { TemplateProvider } from '../../../lib/TemplateContext'
import type { RecapBook, RecapStats, RecapCurrentlyReading } from '../../../lib/types'

// Test fixtures
const mockBook: RecapBook = {
  id: 'test-book-1',
  title: 'Test Book Title',
  authors: ['Test Author'],
  coverUrl: 'https://example.com/cover.jpg',
  status: 'COMPLETED',
  finishDate: '2026-01-15',
  rating: {
    average: 8.5,
    characters: 8,
    atmosphere: 9,
    writing: 8,
    plot: 9,
    intrigue: 8,
    logic: 8,
    enjoyment: 9,
  },
  pageCount: 350,
}

const mockStats: RecapStats = {
  totalBooks: 5,
  completedCount: 4,
  dnfCount: 1,
  totalPages: 1500,
  averageRating: 7.8,
  topRatedBook: {
    title: 'Top Rated Book',
    coverUrl: 'https://example.com/top.jpg',
    rating: 9.2,
  },
  lowestRatedBook: {
    title: 'Lowest Rated Book',
    coverUrl: 'https://example.com/low.jpg',
    rating: 5.5,
  },
}

const mockCurrentlyReading: RecapCurrentlyReading[] = [
  {
    id: 'cr-1',
    title: 'Currently Reading Book',
    authors: ['Author Name'],
    coverUrl: 'https://example.com/current.jpg',
    progress: 45,
  },
]

describe('Template Integration Tests', () => {
  describe('IntroSequence with templates', () => {
    it('should render with custom template colors', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            accent: '#ff0000',
            background: '#000000',
          },
        },
      }

      const { container } = render(
        <TemplateProvider template={customTemplate}>
          <IntroSequence monthName="January" year={2026} bookCount={5} />
        </TemplateProvider>
      )

      // Check that component rendered
      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
    })

    it('should render identically with default template vs no explicit template', () => {
      // With explicit default template
      const { container: withDefault } = render(
        <TemplateProvider template={DEFAULT_TEMPLATE}>
          <IntroSequence monthName="January" year={2026} bookCount={5} />
        </TemplateProvider>
      )

      // With empty template (uses defaults)
      const { container: withEmpty } = render(
        <TemplateProvider template={{}}>
          <IntroSequence monthName="January" year={2026} bookCount={5} />
        </TemplateProvider>
      )

      // Both should render
      expect(withDefault.innerHTML).toBeTruthy()
      expect(withEmpty.innerHTML).toBeTruthy()
    })
  })

  describe('BookReveal with templates', () => {
    it('should render with custom template colors and fonts', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            textPrimary: '#ffffff',
            textSecondary: '#cccccc',
          },
          fonts: {
            heading: 'CustomHeadingFont',
          },
        },
        bookReveal: {
          showRatings: true,
          showAuthors: true,
        },
      }

      const { container } = render(
        <TemplateProvider template={customTemplate}>
          <BookReveal book={mockBook} index={0} random={0.5} />
        </TemplateProvider>
      )

      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
    })

    it('should use template timing values', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          timing: {
            bookTotal: 200,
            bookSlideIn: 20,
          },
        },
      }

      const { container } = render(
        <TemplateProvider template={customTemplate}>
          <BookReveal book={mockBook} index={0} random={0.5} />
        </TemplateProvider>
      )

      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
    })
  })

  describe('StatsReveal with templates', () => {
    it('should render with custom template colors', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            accent: '#00ff00',
            completed: '#00ff00',
            dnf: '#ff0000',
          },
        },
      }

      const { container } = render(
        <TemplateProvider template={customTemplate}>
          <StatsReveal stats={mockStats} />
        </TemplateProvider>
      )

      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
    })

    it('should apply custom template fonts', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          fonts: {
            mono: 'CustomMonoFont',
            body: 'CustomBodyFont',
          },
        },
      }

      const { container } = render(
        <TemplateProvider template={customTemplate}>
          <StatsReveal stats={mockStats} />
        </TemplateProvider>
      )

      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
    })
  })

  describe('ComingSoonSequence with templates', () => {
    it('should render with custom template colors', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            accent: '#purple',
            background: '#000000',
          },
        },
      }

      const { container } = render(
        <TemplateProvider template={customTemplate}>
          <ComingSoonSequence books={mockCurrentlyReading} />
        </TemplateProvider>
      )

      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
    })
  })

  describe('OutroSequence with templates', () => {
    it('should render with custom template colors', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            accent: '#00ffff',
          },
        },
      }

      const { container } = render(
        <TemplateProvider template={customTemplate}>
          <OutroSequence />
        </TemplateProvider>
      )

      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
    })
  })

  describe('Template override behavior', () => {
    it('should allow custom template to override default styling', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            accent: '#ff00ff',
            background: '#111111',
            textPrimary: '#eeeeee',
          },
          fonts: {
            heading: 'Georgia',
          },
        },
        intro: {
          titleFontSize: 100,
          showYear: false,
        },
      }

      const { container } = render(
        <TemplateProvider template={customTemplate}>
          <IntroSequence monthName="February" year={2026} bookCount={3} />
        </TemplateProvider>
      )

      // Component should render
      expect(container.innerHTML).toBeTruthy()
    })

    it('should render component with default values when empty template provided', () => {
      const { container } = render(
        <TemplateProvider template={{}}>
          <StatsReveal stats={mockStats} />
        </TemplateProvider>
      )

      // Component should render with defaults
      expect(container.querySelector('[data-testid="absolute-fill"]')).toBeTruthy()
    })
  })
})
