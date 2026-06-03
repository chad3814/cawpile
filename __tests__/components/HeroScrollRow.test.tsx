import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HeroScrollRow, { computePageStep } from '@/components/HeroScrollRow'

describe('computePageStep', () => {
  // Dashboard cards: w-40 (160px) with gap-4 (16px) => 176px stride.
  const CARD = 160
  const STRIDE = 176

  it('steps by a whole number of item strides, never the raw container width', () => {
    // The reported bug: a ~1010px container paged by 1010px lands mid-item.
    const step = computePageStep(1010, CARD, STRIDE)
    expect(step % STRIDE).toBe(0) // every page boundary lands on an item edge
    expect(step).not.toBe(1010) // not the raw container width that sliced cards
    expect(step).toBe(5 * STRIDE) // 5 whole cards fit in 1010px (880px)
  })

  it('keeps every page boundary aligned to an item edge', () => {
    const step = computePageStep(1010, CARD, STRIDE)
    for (let page = 0; page <= 4; page++) {
      expect((page * step) % STRIDE).toBe(0)
    }
  })

  it('fits more whole items in a wider container', () => {
    expect(computePageStep(1200, CARD, STRIDE)).toBe(6 * STRIDE) // 1216px would overflow, 6 fit
    expect(computePageStep(400, CARD, STRIDE)).toBe(2 * STRIDE)
  })

  it('always advances by at least one item, even in a narrow container', () => {
    expect(computePageStep(100, CARD, STRIDE)).toBe(STRIDE)
  })

  it('falls back to the container width before dimensions are measurable', () => {
    expect(computePageStep(0, 0, 0)).toBe(0)
    expect(computePageStep(800, 0, 0)).toBe(800)
  })
})

describe('HeroScrollRow', () => {
  it('renders children', () => {
    render(
      <HeroScrollRow>
        <div>Item 1</div>
        <div>Item 2</div>
      </HeroScrollRow>
    )
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('clips overflow on the container', () => {
    const { container } = render(
      <HeroScrollRow>
        <div>Item</div>
      </HeroScrollRow>
    )
    // The clipping container is the first child of the outer relative wrapper
    const clippingDiv = container.querySelector('.overflow-hidden')
    expect(clippingDiv).toBeInTheDocument()
  })

  it('renders a flex track inside the clipping container', () => {
    const { container } = render(
      <HeroScrollRow>
        <div>Item</div>
      </HeroScrollRow>
    )
    const track = container.querySelector('.overflow-hidden > div')
    expect(track).toBeInTheDocument()
    expect(track?.className).toContain('flex')
    expect(track?.className).toContain('transition-transform')
  })

  it('does not render arrow buttons when all items fit (JSDOM has zero dimensions)', () => {
    render(
      <HeroScrollRow>
        <div>Item 1</div>
        <div>Item 2</div>
      </HeroScrollRow>
    )
    expect(screen.queryByRole('button', { name: 'Previous' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
  })
})
