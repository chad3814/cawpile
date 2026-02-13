"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { SwatchIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'

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
  isPublished?: boolean
}

interface TemplateCardProps {
  template: TemplateCardData
  isSelected: boolean
  isAdmin?: boolean
  isPublished?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

const COLOR_SWATCH_KEYS = ['background', 'accent', 'textPrimary', 'accentSecondary', 'backgroundSecondary'] as const

export default function TemplateCard({ template, isSelected, isAdmin, isPublished, onDelete }: TemplateCardProps) {
  const router = useRouter()
  const colors = template.config?.global?.colors
  const swatches = COLOR_SWATCH_KEYS
    .map((key) => colors?.[key])
    .filter((color): color is string => Boolean(color))

  // Determine published status: prop overrides template data
  const published = isPublished ?? template.isPublished

  const cardClasses = `block rounded-lg border bg-card shadow-sm transition-all hover:shadow-md ${
    isSelected
      ? 'border-primary ring-2 ring-primary'
      : 'border-border hover:border-primary/50'
  }`

  const cardInner = (
    <>
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

        {/* Published/Draft status badge for admin */}
        {isAdmin && (
          <div
            className={`absolute top-2 left-2 text-xs font-medium px-2 py-1 rounded-full ${
              published
                ? 'bg-green-600/90 text-white'
                : 'bg-yellow-500/90 text-black'
            }`}
            data-testid="template-status-badge"
          >
            {published ? 'Published' : 'Draft'}
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

        {/* Admin action buttons */}
        {isAdmin && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
            <Link
              href={`/dashboard/templates/${template.id}/edit`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-card border border-border text-card-foreground hover:bg-muted transition-colors"
              data-testid="template-edit-btn"
            >
              <PencilSquareIcon className="h-3.5 w-3.5" />
              Edit
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-card border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 transition-colors"
              data-testid="template-delete-btn"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>
    </>
  )

  // Admin mode: use a div wrapper (avoids nested <a> tags) with click-to-navigate
  if (isAdmin) {
    return (
      <div
        className={`${cardClasses} cursor-pointer`}
        onClick={() => router.push(`/dashboard/templates/${template.id}`)}
        role="link"
      >
        {cardInner}
      </div>
    )
  }

  // Non-admin mode: standard Link wrapper
  return (
    <Link href={`/dashboard/templates/${template.id}`} className={cardClasses}>
      {cardInner}
    </Link>
  )
}
