/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderHook } from '@testing-library/react'
import {
  TemplateProvider,
  useTemplate,
  useColors,
  useFonts,
  useTiming,
  useSequenceConfig,
  useRatingColor,
} from '../TemplateContext'
import { DEFAULT_TEMPLATE } from '../template-types'
import type { VideoTemplate } from '../template-types'

/**
 * Tests for TemplateContext and related hooks
 */
describe('TemplateContext', () => {
  describe('useTemplate', () => {
    it('should return merged template values when used within provider', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            accent: '#ff0000',
          },
        },
      }

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={customTemplate}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useTemplate(), { wrapper })

      // Should have merged template
      expect(result.current.global.colors.accent).toBe('#ff0000')
      // Should have defaults for non-overridden values
      expect(result.current.global.colors.background).toBe(
        DEFAULT_TEMPLATE.global.colors.background
      )
      expect(result.current.intro.layout).toBe(DEFAULT_TEMPLATE.intro.layout)
    })

    it('should throw descriptive error when used outside TemplateProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useTemplate())
      }).toThrow('useTemplate must be used within a TemplateProvider')

      consoleSpy.mockRestore()
    })

    it('should return full default template when empty template is provided', () => {
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={{}}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useTemplate(), { wrapper })

      expect(result.current).toEqual(DEFAULT_TEMPLATE)
    })

    it('should return full default template when undefined template is provided', () => {
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={undefined}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useTemplate(), { wrapper })

      expect(result.current).toEqual(DEFAULT_TEMPLATE)
    })
  })

  describe('useColors', () => {
    it('should return template colors from context', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            accent: '#00ff00',
            background: '#111111',
          },
        },
      }

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={customTemplate}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useColors(), { wrapper })

      expect(result.current.accent).toBe('#00ff00')
      expect(result.current.background).toBe('#111111')
      // Default colors should be preserved
      expect(result.current.textPrimary).toBe(DEFAULT_TEMPLATE.global.colors.textPrimary)
    })
  })

  describe('useFonts', () => {
    it('should return template fonts from context', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          fonts: {
            heading: 'CustomFont',
          },
        },
      }

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={customTemplate}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useFonts(), { wrapper })

      expect(result.current.heading).toBe('CustomFont')
      // Default fonts should be preserved
      expect(result.current.body).toBe(DEFAULT_TEMPLATE.global.fonts.body)
      expect(result.current.mono).toBe(DEFAULT_TEMPLATE.global.fonts.mono)
    })
  })

  describe('useTiming', () => {
    it('should return template timing from context', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          timing: {
            introTotal: 100,
            bookTotal: 200,
          },
        },
      }

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={customTemplate}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useTiming(), { wrapper })

      expect(result.current.introTotal).toBe(100)
      expect(result.current.bookTotal).toBe(200)
      // Default timing should be preserved
      expect(result.current.statsTotal).toBe(DEFAULT_TEMPLATE.global.timing.statsTotal)
    })
  })

  describe('useSequenceConfig', () => {
    it('should return specific sequence config for intro', () => {
      const customTemplate: Partial<VideoTemplate> = {
        intro: {
          layout: 'split',
          titleFontSize: 80,
        },
      }

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={customTemplate}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useSequenceConfig('intro'), { wrapper })

      expect(result.current.layout).toBe('split')
      expect(result.current.titleFontSize).toBe(80)
      // Default values preserved
      expect(result.current.showYear).toBe(DEFAULT_TEMPLATE.intro.showYear)
    })

    it('should return specific sequence config for bookReveal', () => {
      const customTemplate: Partial<VideoTemplate> = {
        bookReveal: {
          layout: 'grid',
          showRatings: false,
        },
      }

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={customTemplate}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useSequenceConfig('bookReveal'), { wrapper })

      expect(result.current.layout).toBe('grid')
      expect(result.current.showRatings).toBe(false)
    })

    it('should return specific sequence config for statsReveal', () => {
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={{}}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useSequenceConfig('statsReveal'), { wrapper })

      expect(result.current).toEqual(DEFAULT_TEMPLATE.statsReveal)
    })

    it('should return specific sequence config for comingSoon', () => {
      const customTemplate: Partial<VideoTemplate> = {
        comingSoon: {
          maxBooks: 5,
        },
      }

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={customTemplate}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useSequenceConfig('comingSoon'), { wrapper })

      expect(result.current.maxBooks).toBe(5)
    })

    it('should return specific sequence config for outro', () => {
      const customTemplate: Partial<VideoTemplate> = {
        outro: {
          customText: 'Thanks for watching!',
        },
      }

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={customTemplate}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useSequenceConfig('outro'), { wrapper })

      expect(result.current.customText).toBe('Thanks for watching!')
    })
  })

  describe('useRatingColor', () => {
    it('should return ratingHigh color for ratings >= 8', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            ratingHigh: '#00ff00',
          },
        },
      }

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={customTemplate}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useRatingColor(), { wrapper })

      expect(result.current(10)).toBe('#00ff00')
      expect(result.current(8)).toBe('#00ff00')
      expect(result.current(9.5)).toBe('#00ff00')
    })

    it('should return ratingMedium color for ratings 5-7', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            ratingMedium: '#ffff00',
          },
        },
      }

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={customTemplate}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useRatingColor(), { wrapper })

      expect(result.current(5)).toBe('#ffff00')
      expect(result.current(7)).toBe('#ffff00')
      expect(result.current(6.5)).toBe('#ffff00')
    })

    it('should return ratingLow color for ratings < 5', () => {
      const customTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            ratingLow: '#ff0000',
          },
        },
      }

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={customTemplate}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useRatingColor(), { wrapper })

      expect(result.current(4)).toBe('#ff0000')
      expect(result.current(1)).toBe('#ff0000')
      expect(result.current(0)).toBe('#ff0000')
    })
  })

  describe('context with partial template', () => {
    it('should provide defaults for all missing values in partial template', () => {
      // Only override a single deeply nested value
      const partialTemplate: Partial<VideoTemplate> = {
        global: {
          colors: {
            accent: '#purple',
          },
        },
      }

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={partialTemplate}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useTemplate(), { wrapper })

      // Custom value applied
      expect(result.current.global.colors.accent).toBe('#purple')

      // All other values should be defaults
      expect(result.current.global.colors.background).toBe(
        DEFAULT_TEMPLATE.global.colors.background
      )
      expect(result.current.global.fonts).toEqual(DEFAULT_TEMPLATE.global.fonts)
      expect(result.current.global.timing).toEqual(DEFAULT_TEMPLATE.global.timing)
      expect(result.current.intro).toEqual(DEFAULT_TEMPLATE.intro)
      expect(result.current.bookReveal).toEqual(DEFAULT_TEMPLATE.bookReveal)
      expect(result.current.statsReveal).toEqual(DEFAULT_TEMPLATE.statsReveal)
      expect(result.current.comingSoon).toEqual(DEFAULT_TEMPLATE.comingSoon)
      expect(result.current.outro).toEqual(DEFAULT_TEMPLATE.outro)
    })
  })
})
