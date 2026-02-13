"use client"

import Link from 'next/link'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { SwatchIcon } from '@heroicons/react/24/outline'

interface TemplateCreator {
  name: string | null
  image: string | null
}

interface TemplateConfig {
  global?: {
    colors?: {
      background?: string
      accent?: string
      textPrimary?: string
      accentSecondary?: string
      backgroundSecondary?: string
      [key: string]: string | undefined
    }
    fonts?: {
      heading?: string
      body?: string
      mono?: string
    }
  }
  intro?: { layout?: string }
  bookReveal?: { layout?: string }
  statsReveal?: { layout?: string }
  comingSoon?: { layout?: string }
  outro?: { layout?: string }
}

export interface TemplateCardData {
  id: string
  name: string
  previewThumbnailUrl: string | null
  config: TemplateConfig
  creator: TemplateCreator | null
}

interface TemplateCardProps {
  template: TemplateCardData
  isSelected: boolean
}

const COLOR_SWATCH_KEYS = ['background', 'accent', 'textPrimary', 'accentSecondary', 'backgroundSecondary'] as const

export default function TemplateCard({ template, isSelected }: TemplateCardProps) {
  const colors = template.config?.global?.colors
  const swatches = COLOR_SWATCH_KEYS
    .map((key) => colors?.[key])
    .filter((color): color is string => Boolean(color))

  return (
    <Link
      href={`/dashboard/templates/${template.id}`}
      className={`block rounded-lg border bg-card shadow-sm transition-all hover:shadow-md ${
        isSelected
          ? 'border-primary ring-2 ring-primary'
          : 'border-border hover:border-primary/50'
      }`}
    >
      <div className="relative">
        {/* Preview thumbnail */}
        {template.previewThumbnailUrl ? (
          <img
            src={template.previewThumbnailUrl}
            alt={`${template.name} preview`}
            className="w-full h-40 object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-40 rounded-t-lg bg-muted flex items-center justify-center" data-testid="template-placeholder">
            <SwatchIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Selected badge */}
        {isSelected && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
            <CheckCircleIcon className="h-4 w-4" />
            <span>Selected</span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Template name */}
        <h3 className="font-semibold text-card-foreground truncate">{template.name}</h3>

        {/* Creator name */}
        <p className="text-sm text-muted-foreground mt-1">
          by {template.creator?.name || 'System'}
        </p>

        {/* Color swatches */}
        {swatches.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3" data-testid="color-swatches">
            {swatches.map((color, index) => (
              <div
                key={index}
                className="w-5 h-5 rounded-full border border-border"
                style={{ backgroundColor: color }}
                title={COLOR_SWATCH_KEYS[index]}
                data-testid={`swatch-${COLOR_SWATCH_KEYS[index]}`}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
