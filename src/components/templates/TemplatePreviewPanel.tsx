"use client"

import type { ResolvedColorsConfig, ResolvedFontsConfig } from '@/types/video-template'

// ============================================================================
// Types
// ============================================================================

interface TimingTotals {
  introTotal: number
  bookTotal: number
  statsTotal: number
  comingSoonTotal: number
  outroTotal: number
  transitionOverlap: number
}

interface SequenceLayouts {
  intro: string
  bookReveal: string
  statsReveal: string
  comingSoon: string
  outro: string
}

interface BackgroundImages {
  global?: string | null
  intro?: string | null
  bookReveal?: string | null
  statsReveal?: string | null
  comingSoon?: string | null
  outro?: string | null
}

interface BackgroundOpacities {
  global?: number
  intro?: number
  bookReveal?: number
  statsReveal?: number
  comingSoon?: number
  outro?: number
}

export interface TemplatePreviewPanelProps {
  colors: ResolvedColorsConfig
  fonts: ResolvedFontsConfig
  timingTotals: TimingTotals
  layouts: SequenceLayouts
  backgroundImages?: BackgroundImages
  backgroundOpacities?: BackgroundOpacities
}

// ============================================================================
// Utility: formatColorLabel
// ============================================================================

function formatColorLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

// ============================================================================
// Color Group Definitions
// ============================================================================

const COLOR_GROUPS: { heading: string; keys: (keyof ResolvedColorsConfig)[] }[] = [
  { heading: 'Backgrounds', keys: ['background', 'backgroundSecondary', 'backgroundTertiary'] },
  { heading: 'Text', keys: ['textPrimary', 'textSecondary', 'textMuted'] },
  { heading: 'Accents', keys: ['accent', 'accentSecondary', 'accentMuted'] },
  { heading: 'Status', keys: ['completed', 'dnf'] },
  { heading: 'Rating', keys: ['ratingHigh', 'ratingMedium', 'ratingLow'] },
  { heading: 'Effects', keys: ['overlay', 'grain'] },
]

// ============================================================================
// Sequence Definitions for Layout Summary
// ============================================================================

const SEQUENCE_SECTIONS = [
  { key: 'intro' as const, label: 'Intro' },
  { key: 'bookReveal' as const, label: 'Book Reveal' },
  { key: 'statsReveal' as const, label: 'Stats Reveal' },
  { key: 'comingSoon' as const, label: 'Coming Soon' },
  { key: 'outro' as const, label: 'Outro' },
]

// ============================================================================
// Timing Bar Segment Definitions
// ============================================================================

const TIMING_SEGMENTS: {
  label: string
  key: keyof TimingTotals
  color: string
}[] = [
  { label: 'Intro', key: 'introTotal', color: 'bg-blue-500' },
  { label: 'Book', key: 'bookTotal', color: 'bg-green-500' },
  { label: 'Stats', key: 'statsTotal', color: 'bg-yellow-500' },
  { label: 'Soon', key: 'comingSoonTotal', color: 'bg-purple-500' },
  { label: 'Outro', key: 'outroTotal', color: 'bg-red-500' },
]

// ============================================================================
// Component
// ============================================================================

export default function TemplatePreviewPanel({
  colors,
  fonts,
  timingTotals,
  layouts,
  backgroundImages,
  backgroundOpacities,
}: TemplatePreviewPanelProps) {
  const totalFrames =
    timingTotals.introTotal +
    timingTotals.bookTotal +
    timingTotals.statsTotal +
    timingTotals.comingSoonTotal +
    timingTotals.outroTotal

  // Determine if any background images are set
  const hasAnyBackgroundImage = backgroundImages && (
    backgroundImages.global ||
    backgroundImages.intro ||
    backgroundImages.bookReveal ||
    backgroundImages.statsReveal ||
    backgroundImages.comingSoon ||
    backgroundImages.outro
  )

  return (
    <div className="space-y-6" data-testid="template-preview-panel">
      {/* Color Palette Preview */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Color Palette</h3>
        {COLOR_GROUPS.map((group) => (
          <div key={group.heading} className="mb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">{group.heading}</p>
            <div className="flex flex-wrap gap-2">
              {group.keys.map((colorKey) => (
                <div key={colorKey} className="flex flex-col items-center gap-1" data-testid={`preview-swatch-${colorKey}`}>
                  <div
                    className="w-8 h-8 rounded-full border border-border"
                    style={{ backgroundColor: colors[colorKey] }}
                  />
                  <span className="text-[10px] text-muted-foreground truncate max-w-[60px]">
                    {formatColorLabel(colorKey)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Font Preview */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Font Preview</h3>
        <div className="space-y-2 bg-muted rounded-lg p-3">
          <p
            className="text-lg"
            style={{ fontFamily: fonts.heading }}
            data-testid="preview-font-heading"
          >
            Heading Sample
          </p>
          <p
            className="text-sm"
            style={{ fontFamily: fonts.body }}
            data-testid="preview-font-body"
          >
            Body text sample
          </p>
          <p
            className="text-xs font-mono"
            style={{ fontFamily: fonts.mono }}
            data-testid="preview-font-mono"
          >
            mono sample
          </p>
        </div>
      </div>

      {/* Layout Summary */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Layout Summary</h3>
        <div className="flex flex-wrap gap-2">
          {SEQUENCE_SECTIONS.map(({ key, label }) => (
            <div
              key={key}
              className="px-2 py-1 bg-muted rounded text-xs text-card-foreground"
              data-testid={`preview-layout-${key}`}
            >
              <span className="text-muted-foreground">{label}:</span>{' '}
              <span className="font-medium">{layouts[key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Backgrounds Section */}
      {hasAnyBackgroundImage && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Backgrounds</h3>
          <div className="flex flex-wrap gap-3">
            {SEQUENCE_SECTIONS.map(({ key, label }) => {
              const imageUrl = backgroundImages?.[key] || backgroundImages?.global || null
              const opacity = backgroundOpacities?.[key] ?? backgroundOpacities?.global ?? 0.7
              if (!imageUrl) return null
              return (
                <div
                  key={key}
                  className="flex flex-col items-center gap-1"
                  data-testid={`preview-bg-${key}`}
                >
                  <div className="relative w-[48px] h-[85px] rounded overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`${label} background`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                  <span className="text-[10px] text-muted-foreground">{Math.round(opacity * 100)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Timing Overview */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Timing Overview</h3>
        {totalFrames > 0 && (
          <div className="flex rounded-lg overflow-hidden h-6" data-testid="preview-timing-bar">
            {TIMING_SEGMENTS.map(({ label, key, color }) => {
              const frames = timingTotals[key]
              const pct = (frames / totalFrames) * 100
              return (
                <div
                  key={label}
                  className={`${color} flex items-center justify-center text-[9px] text-white font-medium overflow-hidden`}
                  style={{ width: `${pct}%` }}
                  title={`${label}: ${frames} frames (${(frames / 30).toFixed(1)}s)`}
                  data-testid={`preview-timing-segment-${label.toLowerCase()}`}
                >
                  {pct > 10 ? label : ''}
                </div>
              )
            })}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
          {TIMING_SEGMENTS.map(({ label, key }) => {
            const frames = timingTotals[key]
            return (
              <span key={label} data-testid={`preview-timing-label-${label.toLowerCase()}`}>
                {label}: {frames}f ({(frames / 30).toFixed(1)}s)
              </span>
            )
          })}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          <span>Total: {totalFrames} frames ({(totalFrames / 30).toFixed(1)}s)</span>
          {' | '}
          <span data-testid="preview-timing-overlap">Overlap: {timingTotals.transitionOverlap} frames</span>
        </div>
      </div>
    </div>
  )
}
