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

  it('applies horizontal scroll classes', () => {
    const { container } = render(
      <HeroScrollRow>
        <div>Item</div>
      </HeroScrollRow>
    )
    const row = container.firstChild as HTMLElement
    expect(row.className).toContain('flex')
    expect(row.className).toContain('overflow-x-auto')
  })
})
