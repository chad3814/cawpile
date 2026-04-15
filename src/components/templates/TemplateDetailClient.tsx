"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftIcon, CheckCircleIcon, DocumentDuplicateIcon, SwatchIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'

interface TemplateCreator {
  name: string | null
  image: string | null
}

interface TemplateConfig {
  global?: {
    colors?: Record<string, string | undefined>
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

interface TemplateDetail {
  id: string
  name: string
  description: string | null
  previewThumbnailUrl: string | null
  config: TemplateConfig
  creator: TemplateCreator | null
}

interface TemplateDetailClientProps {
  template: TemplateDetail
  selectedTemplateId: string | null
}

// Convert camelCase color key to a human-readable label
function formatColorLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

const SEQUENCE_SECTIONS = [
  { key: 'intro', label: 'Intro' },
  { key: 'bookReveal', label: 'Book Reveal' },
  { key: 'statsReveal', label: 'Stats Reveal' },
  { key: 'comingSoon', label: 'Coming Soon' },
  { key: 'outro', label: 'Outro' },
] as const

export default function TemplateDetailClient({ template, selectedTemplateId }: TemplateDetailClientProps) {
  const [isSelected, setIsSelected] = useState(selectedTemplateId === template.id)
  const [selectLoading, setSelectLoading] = useState(false)
  const [selectError, setSelectError] = useState<string | null>(null)
  const [duplicateLoading, setDuplicateLoading] = useState(false)
  const [duplicateError, setDuplicateError] = useState<string | null>(null)
  const [duplicateSuccess, setDuplicateSuccess] = useState(false)

  const colors = template.config?.global?.colors || {}
  const fonts = template.config?.global?.fonts
  const colorEntries = Object.entries(colors).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string'
  )

  const handleSelect = async () => {
    setSelectLoading(true)
    setSelectError(null)
    try {
      const response = await fetch(`/api/user/templates/${template.id}/select`, {
        method: 'POST',
      })
      if (response.ok) {
        setIsSelected(true)
      } else {
        const data = await response.json()
        setSelectError(data.error || 'Failed to select template')
      }
    } catch {
      setSelectError('An error occurred. Please try again.')
    } finally {
      setSelectLoading(false)
    }
  }

  const handleDuplicate = async () => {
    setDuplicateLoading(true)
    setDuplicateError(null)
    setDuplicateSuccess(false)
    try {
      const response = await fetch(`/api/user/templates/${template.id}/duplicate`, {
        method: 'POST',
      })
      if (response.ok) {
        setDuplicateSuccess(true)
      } else {
        const data = await response.json()
        setDuplicateError(data.error || 'Failed to duplicate template')
      }
    } catch {
      setDuplicateError('An error occurred. Please try again.')
    } finally {
      setDuplicateLoading(false)
    }
  }

  return (
    <div>
      {/* Back navigation */}
      <Link
        href="/dashboard/templates"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Templates
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: preview and actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Preview thumbnail */}
          {template.previewThumbnailUrl ? (
            <Image
              src={template.previewThumbnailUrl}
              alt={`${template.name} preview`}
              className="w-full rounded-lg border border-border"
              width={400}
              height={711}
            />
          ) : (
            <div className="w-full aspect-video rounded-lg bg-muted flex items-center justify-center border border-border">
              <SwatchIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {/* Creator info */}
          <div className="flex items-center gap-3">
            {template.creator?.image ? (
              <Image
                src={template.creator.image}
                alt={template.creator.name || 'Creator'}
                className="w-10 h-10 rounded-full"
                width={40}
                height={40}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground text-sm font-medium">
                  {(template.creator?.name || 'S')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Created by</p>
              <p className="font-medium text-card-foreground">
                {template.creator?.name || 'System'}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {isSelected ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary font-medium border border-primary"
              >
                <CheckCircleSolidIcon className="h-5 w-5" />
                Currently Selected
              </button>
            ) : (
              <button
                onClick={handleSelect}
                disabled={selectLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectLoading ? (
                  <span>Selecting...</span>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    Select for My Recap
                  </>
                )}
              </button>
            )}
            {selectError && (
              <p className="text-sm text-red-500">{selectError}</p>
            )}

            <button
              onClick={handleDuplicate}
              disabled={duplicateLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-card text-card-foreground font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {duplicateLoading ? (
                <span>Duplicating...</span>
              ) : (
                <>
                  <DocumentDuplicateIcon className="h-5 w-5" />
                  Duplicate
                </>
              )}
            </button>
            {duplicateError && (
              <p className="text-sm text-red-500">{duplicateError}</p>
            )}
            {duplicateSuccess && (
              <p className="text-sm text-green-600">
                Template duplicated!{' '}
                <Link href="/dashboard/templates" className="underline hover:text-green-700">
                  View in My Templates
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Right column: template details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Name and description */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{template.name}</h1>
            {template.description && (
              <p className="text-muted-foreground mt-2">{template.description}</p>
            )}
          </div>

          {/* Color palette */}
          {colorEntries.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Color Palette</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {colorEntries.map(([key, color]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full border border-border shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {formatColorLabel(key)}
                      </p>
                      <p className="text-xs text-muted-foreground">{color}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fonts */}
          {fonts && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Fonts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {fonts.heading && (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Heading</p>
                    <p className="font-medium text-card-foreground">{fonts.heading}</p>
                  </div>
                )}
                {fonts.body && (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Body</p>
                    <p className="font-medium text-card-foreground">{fonts.body}</p>
                  </div>
                )}
                {fonts.mono && (
                  <div className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Mono</p>
                    <p className="font-medium text-card-foreground">{fonts.mono}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Layout choices */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Layout Choices</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {SEQUENCE_SECTIONS.map(({ key, label }) => {
                const section = template.config?.[key] as { layout?: string } | undefined
                const layout = section?.layout
                if (!layout) return null
                return (
                  <div key={key} className="bg-card border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">{label}</p>
                    <p className="font-medium text-card-foreground">{layout}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
