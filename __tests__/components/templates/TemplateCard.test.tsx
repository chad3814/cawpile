/**
 * Tests for TemplateCard component
 * Task Group 4.1: Browse page UI component tests
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import TemplateCard from '@/components/templates/TemplateCard'
import type { TemplateCardData } from '@/components/templates/TemplateCard'

// Mock next/link to render as a plain anchor
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

describe('TemplateCard', () => {
  const baseTemplate: TemplateCardData = {
    id: 'tmpl-1',
    name: 'Sunset Vibes',
    previewThumbnailUrl: 'https://example.com/preview.jpg',
    config: {
      global: {
        colors: {
          background: '#1a1a2e',
          accent: '#e94560',
          textPrimary: '#ffffff',
          accentSecondary: '#0f3460',
        },
      },
    },
    creator: {
      name: 'Jane Admin',
      image: 'https://example.com/avatar.jpg',
    },
  }

  test('renders name, creator name (or "System" for null creator), and color swatches', () => {
    // Test with a creator
    const { unmount } = render(<TemplateCard template={baseTemplate} isSelected={false} />)
    expect(screen.getByText('Sunset Vibes')).toBeInTheDocument()
    expect(screen.getByText('by Jane Admin')).toBeInTheDocument()
    expect(screen.getByTestId('color-swatches')).toBeInTheDocument()
    expect(screen.getByTestId('swatch-background')).toHaveStyle({ backgroundColor: '#1a1a2e' })
    expect(screen.getByTestId('swatch-accent')).toHaveStyle({ backgroundColor: '#e94560' })
    unmount()

    // Test with null creator (System)
    const systemTemplate: TemplateCardData = {
      ...baseTemplate,
      id: 'tmpl-system',
      name: 'System Template',
      creator: null,
    }
    render(<TemplateCard template={systemTemplate} isSelected={false} />)
    expect(screen.getByText('by System')).toBeInTheDocument()
  })

  test('shows "Selected" indicator when the template matches selectedTemplateId', () => {
    const { unmount } = render(<TemplateCard template={baseTemplate} isSelected={true} />)
    expect(screen.getByText('Selected')).toBeInTheDocument()
    unmount()

    // Not selected - should not show indicator
    render(<TemplateCard template={baseTemplate} isSelected={false} />)
    expect(screen.queryByText('Selected')).not.toBeInTheDocument()
  })

  test('renders placeholder when previewThumbnailUrl is null', () => {
    const templateNoImage: TemplateCardData = {
      ...baseTemplate,
      previewThumbnailUrl: null,
    }
    render(<TemplateCard template={templateNoImage} isSelected={false} />)
    expect(screen.getByTestId('template-placeholder')).toBeInTheDocument()
    // Should not render an img element
    expect(screen.queryByAltText('Sunset Vibes preview')).not.toBeInTheDocument()
  })
})
