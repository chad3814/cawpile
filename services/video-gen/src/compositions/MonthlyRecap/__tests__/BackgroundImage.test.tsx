/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react'
import type { VideoTemplate } from '../../../lib/template-types'

// Mock remotion with all needed exports (including Easing methods used by animations.ts)
vi.mock('remotion', () => {
  const identity = (t: number) => t
  const wrapFn = (_fn?: (t: number) => number) => identity
  const EasingObj = {
    out: wrapFn,
    in: wrapFn,
    inOut: wrapFn,
    cubic: identity,
    bezier: () => identity,
    elastic: (_bounciness?: number) => identity,
    bounce: identity,
    ease: identity,
    linear: identity,
  }

  return {
    AbsoluteFill: ({ children, style, ...props }: { children?: React.ReactNode; style?: React.CSSProperties }) =>
      React.createElement('div', { 'data-testid': 'absolute-fill', style, ...props }, children),
    useCurrentFrame: () => 30,
    useVideoConfig: () => ({ fps: 30, width: 1080, height: 1920, durationInFrames: 150 }),
    interpolate: (_value: number, _inputRange: number[], outputRange: number[]) => outputRange[outputRange.length - 1],
    spring: () => 1,
    Img: ({ src, style, ...props }: { src: string; style?: React.CSSProperties }) =>
      React.createElement('img', { src, style, 'data-testid': 'remotion-img', ...props }),
    Easing: EasingObj,
  }
})

import { TemplateProvider } from '../../../lib/TemplateContext'
import { IntroSequence } from '../IntroSequence'

describe('IntroSequence background image rendering', () => {
  const defaultProps = {
    monthName: 'January',
    year: 2026,
    bookCount: 5,
  }

  it('should render Img element when background image is provided in template context', () => {
    const template: Partial<VideoTemplate> = {
      global: {
        backgroundImage: 'https://example.com/bg.jpg',
        backgroundOverlayOpacity: 0.5,
      },
    }

    const { container } = render(
      React.createElement(
        TemplateProvider,
        { template } as React.ComponentProps<typeof TemplateProvider>,
        React.createElement(IntroSequence, defaultProps)
      )
    )

    // Find img elements with the background image src
    const imgs = container.querySelectorAll('img[src="https://example.com/bg.jpg"]')
    expect(imgs.length).toBeGreaterThan(0)
  })

  it('should not render background image layer when backgroundImage is null (preserves current behavior)', () => {
    const template: Partial<VideoTemplate> = {
      // No backgroundImage set - defaults to null
    }

    const { container } = render(
      React.createElement(
        TemplateProvider,
        { template } as React.ComponentProps<typeof TemplateProvider>,
        React.createElement(IntroSequence, defaultProps)
      )
    )

    // No background images should exist
    const allImgs = container.querySelectorAll('img[data-testid="remotion-img"]')
    expect(allImgs.length).toBe(0)
  })
})
