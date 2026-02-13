/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderHook } from '@testing-library/react'
import { TemplateProvider, useBackgroundImage } from '../TemplateContext'
import { DEFAULT_TEMPLATE } from '../template-types'
import type { VideoTemplate } from '../template-types'

describe('useBackgroundImage', () => {
  it('should return resolved background image URL and opacity from per-sequence override', () => {
    const customTemplate: Partial<VideoTemplate> = {
      global: {
        backgroundImage: 'https://example.com/global-bg.jpg',
        backgroundOverlayOpacity: 0.5,
      },
      intro: {
        backgroundImage: 'https://example.com/intro-bg.jpg',
        backgroundOverlayOpacity: 0.3,
      },
    }

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      React.createElement(TemplateProvider, { template: customTemplate } as React.ComponentProps<typeof TemplateProvider>, children)
    )

    const { result } = renderHook(() => useBackgroundImage('intro'), { wrapper })

    expect(result.current.backgroundImage).toBe('https://example.com/intro-bg.jpg')
    expect(result.current.backgroundOverlayOpacity).toBe(0.3)
  })

  it('should fall back to global background image when intro has no override', () => {
    const customTemplate: Partial<VideoTemplate> = {
      global: {
        backgroundImage: 'https://example.com/global-bg.jpg',
        backgroundOverlayOpacity: 0.6,
      },
    }

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      React.createElement(TemplateProvider, { template: customTemplate } as React.ComponentProps<typeof TemplateProvider>, children)
    )

    const { result } = renderHook(() => useBackgroundImage('intro'), { wrapper })

    expect(result.current.backgroundImage).toBe('https://example.com/global-bg.jpg')
    expect(result.current.backgroundOverlayOpacity).toBe(0.6)
  })

  it('should return { backgroundImage: null, backgroundOverlayOpacity: 0.7 } when no background is set anywhere', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      React.createElement(TemplateProvider, { template: {} } as React.ComponentProps<typeof TemplateProvider>, children)
    )

    const { result } = renderHook(() => useBackgroundImage('intro'), { wrapper })

    expect(result.current.backgroundImage).toBe(null)
    expect(result.current.backgroundOverlayOpacity).toBe(0.7)
  })
})
