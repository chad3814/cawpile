import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HeroScrollRow from '@/components/HeroScrollRow'

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
