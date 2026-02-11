/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderHook } from '@testing-library/react'
import { TemplateProvider, useRatingColor, useTemplate } from '../TemplateContext'
import { COLORS } from '../theme'

/**
 * Strategic edge case tests for template system
 * These tests fill gaps identified in Task Group 7 review
 */
describe('Template Edge Cases', () => {
  describe('useRatingColor boundary conditions', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <TemplateProvider template={{}}>{children}</TemplateProvider>
    )

    it('should return ratingMedium for rating exactly at 7.99 (just below boundary)', () => {
      const { result } = renderHook(() => useRatingColor(), { wrapper })
      const getRatingColor = result.current

      // 7.99 is less than 8, so should be medium
      const color = getRatingColor(7.99)
      // Should not equal ratingHigh (which is for >= 8)
      expect(color).not.toBe(COLORS.ratingHigh)
      expect(color).toBe(COLORS.ratingMedium)
    })

    it('should return ratingHigh for rating exactly at 8.0 (at boundary)', () => {
      const { result } = renderHook(() => useRatingColor(), { wrapper })
      const getRatingColor = result.current

      // 8.0 is exactly at boundary, should be high
      const color = getRatingColor(8.0)
      expect(color).toBe(COLORS.ratingHigh)
    })

    it('should return ratingLow for rating exactly at 4.99 (just below medium boundary)', () => {
      const { result } = renderHook(() => useRatingColor(), { wrapper })
      const getRatingColor = result.current

      // 4.99 is less than 5, so should be low
      const color = getRatingColor(4.99)
      expect(color).toBe(COLORS.ratingLow)
    })

    it('should return ratingMedium for rating exactly at 5.0 (at low/medium boundary)', () => {
      const { result } = renderHook(() => useRatingColor(), { wrapper })
      const getRatingColor = result.current

      // 5.0 is at the boundary, should be medium
      const color = getRatingColor(5.0)
      expect(color).toBe(COLORS.ratingMedium)
    })
  })

  describe('Template with only single section override', () => {
    it('should correctly merge when only intro section is provided', () => {
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={{ intro: { layout: 'minimal' } }}>{children}</TemplateProvider>
      )

      const { result } = renderHook(() => useTemplate(), { wrapper })

      // Intro should have custom value
      expect(result.current.intro.layout).toBe('minimal')
      // All other sections should have defaults
      expect(result.current.bookReveal.layout).toBe('sequential')
      expect(result.current.statsReveal.layout).toBe('stacked')
      expect(result.current.global.colors.accent).toBeDefined()
    })

    it('should correctly merge when only timing is provided', () => {
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <TemplateProvider template={{ global: { timing: { introTotal: 100 } } }}>
          {children}
        </TemplateProvider>
      )

      const { result } = renderHook(() => useTemplate(), { wrapper })

      // Custom timing should be applied
      expect(result.current.global.timing.introTotal).toBe(100)
      // Other timing values should have defaults
      expect(result.current.global.timing.bookTotal).toBe(150) // Default
      // Colors and fonts should have defaults
      expect(result.current.global.colors.accent).toBeDefined()
      expect(result.current.global.fonts.heading).toBeDefined()
    })
  })
})
