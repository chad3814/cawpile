"use client"

import { useReducer, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_TEMPLATE } from '@/types/video-template'
import type {
  VideoTemplate,
  ResolvedVideoTemplate,
  ResolvedColorsConfig,
  ResolvedFontsConfig,
  IntroLayout,
  BookRevealLayout,
  StatsRevealLayout,
  ComingSoonLayout,
  OutroLayout,
} from '@/types/video-template'
import { validateTemplateConfig } from '@/lib/video/validateTemplateConfig'
import type { ValidationError } from '@/lib/video/validateTemplateConfig'
import { calculateSubTimings, assembleFullTimingConfig } from '@/lib/video/timingCalculation'
import TemplatePreviewPanel from '@/components/templates/TemplatePreviewPanel'

// ============================================================================
// Types
// ============================================================================

interface TemplateEditorClientProps {
  mode: 'create' | 'edit'
  initialConfig?: VideoTemplate
  templateId?: string
  initialName?: string
  initialDescription?: string
  initialIsPublished?: boolean
}

type TabKey = 'colors' | 'fonts' | 'timing' | 'intro' | 'bookReveal' | 'statsReveal' | 'comingSoon' | 'outro'

interface TabDefinition {
  key: TabKey
  label: string
}

const TABS: TabDefinition[] = [
  { key: 'colors', label: 'Colors' },
  { key: 'fonts', label: 'Fonts' },
  { key: 'timing', label: 'Timing' },
  { key: 'intro', label: 'Intro' },
  { key: 'bookReveal', label: 'Book Reveal' },
  { key: 'statsReveal', label: 'Stats Reveal' },
  { key: 'comingSoon', label: 'Coming Soon' },
  { key: 'outro', label: 'Outro' },
]

// Sequence action type map for dispatching per-sequence actions
type SequenceActionType = 'SET_INTRO' | 'SET_BOOK_REVEAL' | 'SET_STATS_REVEAL' | 'SET_COMING_SOON' | 'SET_OUTRO'

const SEQUENCE_ACTION_MAP: Record<string, SequenceActionType> = {
  intro: 'SET_INTRO',
  bookReveal: 'SET_BOOK_REVEAL',
  statsReveal: 'SET_STATS_REVEAL',
  comingSoon: 'SET_COMING_SOON',
  outro: 'SET_OUTRO',
}

// ============================================================================
// State Management via useReducer
// ============================================================================

export interface EditorState {
  colors: ResolvedColorsConfig
  fonts: ResolvedFontsConfig
  timingTotals: {
    introTotal: number
    bookTotal: number
    statsTotal: number
    comingSoonTotal: number
    outroTotal: number
    transitionOverlap: number
  }
  // Global background image fields
  globalBackgroundImage: string | null
  globalBackgroundOverlayOpacity: number
  intro: {
    layout: IntroLayout
    titleFontSize: number
    subtitleFontSize: number
    showYear: boolean
    backgroundImage: string | null
    backgroundOverlayOpacity: number | null
  }
  bookReveal: {
    layout: BookRevealLayout
    showRatings: boolean
    showAuthors: boolean
    coverSize: 'small' | 'medium' | 'large'
    animationStyle: 'slide' | 'fade' | 'pop'
    backgroundImage: string | null
    backgroundOverlayOpacity: number | null
  }
  statsReveal: {
    layout: StatsRevealLayout
    showTotalBooks: boolean
    showTotalPages: boolean
    showAverageRating: boolean
    showTopBook: boolean
    animateNumbers: boolean
    backgroundImage: string | null
    backgroundOverlayOpacity: number | null
  }
  comingSoon: {
    layout: ComingSoonLayout
    showProgress: boolean
    maxBooks: number
    backgroundImage: string | null
    backgroundOverlayOpacity: number | null
  }
  outro: {
    layout: OutroLayout
    showBranding: boolean
    customText: string
    backgroundImage: string | null
    backgroundOverlayOpacity: number | null
  }
}

export type EditorAction =
  | { type: 'SET_COLOR'; key: keyof ResolvedColorsConfig; value: string }
  | { type: 'SET_FONT'; key: keyof ResolvedFontsConfig; value: string }
  | { type: 'SET_TIMING_TOTAL'; key: string; value: number }
  | { type: 'SET_GLOBAL_BACKGROUND_IMAGE'; value: string | null }
  | { type: 'SET_GLOBAL_BACKGROUND_OVERLAY_OPACITY'; value: number }
  | { type: 'SET_INTRO'; key: string; value: unknown }
  | { type: 'SET_BOOK_REVEAL'; key: string; value: unknown }
  | { type: 'SET_STATS_REVEAL'; key: string; value: unknown }
  | { type: 'SET_COMING_SOON'; key: string; value: unknown }
  | { type: 'SET_OUTRO'; key: string; value: unknown }

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_COLOR':
      return { ...state, colors: { ...state.colors, [action.key]: action.value } }
    case 'SET_FONT':
      return { ...state, fonts: { ...state.fonts, [action.key]: action.value } }
    case 'SET_TIMING_TOTAL':
      return { ...state, timingTotals: { ...state.timingTotals, [action.key]: action.value } }
    case 'SET_GLOBAL_BACKGROUND_IMAGE':
      return { ...state, globalBackgroundImage: action.value }
    case 'SET_GLOBAL_BACKGROUND_OVERLAY_OPACITY':
      return { ...state, globalBackgroundOverlayOpacity: action.value }
    case 'SET_INTRO':
      return { ...state, intro: { ...state.intro, [action.key]: action.value } }
    case 'SET_BOOK_REVEAL':
      return { ...state, bookReveal: { ...state.bookReveal, [action.key]: action.value } }
    case 'SET_STATS_REVEAL':
      return { ...state, statsReveal: { ...state.statsReveal, [action.key]: action.value } }
    case 'SET_COMING_SOON':
      return { ...state, comingSoon: { ...state.comingSoon, [action.key]: action.value } }
    case 'SET_OUTRO':
      return { ...state, outro: { ...state.outro, [action.key]: action.value } }
    default:
      return state
  }
}

export function buildInitialState(template: ResolvedVideoTemplate, rawConfig?: VideoTemplate): EditorState {
  // Helper to extract raw (un-resolved) sequence background fields.
  // When rawConfig is provided, use its values to distinguish overrides from inheritance.
  // A raw value of undefined/null means the sequence inherits from global (state = null).
  // A raw string value means the sequence has its own override.
  function rawSeqBg(seq: 'intro' | 'bookReveal' | 'statsReveal' | 'comingSoon' | 'outro'): { backgroundImage: string | null; backgroundOverlayOpacity: number | null } {
    if (rawConfig) {
      const rawSeq = rawConfig[seq] as Record<string, unknown> | undefined
      const rawBgImg = rawSeq?.backgroundImage
      const rawBgOpacity = rawSeq?.backgroundOverlayOpacity
      return {
        backgroundImage: (typeof rawBgImg === 'string') ? rawBgImg : null,
        backgroundOverlayOpacity: (typeof rawBgOpacity === 'number') ? rawBgOpacity : null,
      }
    }
    // No raw config: use resolved values (backwards compatible)
    return {
      backgroundImage: template[seq].backgroundImage,
      backgroundOverlayOpacity: template[seq].backgroundOverlayOpacity,
    }
  }

  return {
    colors: { ...template.global.colors },
    fonts: { ...template.global.fonts },
    timingTotals: {
      introTotal: template.global.timing.introTotal,
      bookTotal: template.global.timing.bookTotal,
      statsTotal: template.global.timing.statsTotal,
      comingSoonTotal: template.global.timing.comingSoonTotal,
      outroTotal: template.global.timing.outroTotal,
      transitionOverlap: template.global.timing.transitionOverlap,
    },
    globalBackgroundImage: template.global.backgroundImage,
    globalBackgroundOverlayOpacity: template.global.backgroundOverlayOpacity,
    intro: {
      ...template.intro,
      ...rawSeqBg('intro'),
    },
    bookReveal: {
      ...template.bookReveal,
      ...rawSeqBg('bookReveal'),
    },
    statsReveal: {
      ...template.statsReveal,
      ...rawSeqBg('statsReveal'),
    },
    comingSoon: {
      ...template.comingSoon,
      ...rawSeqBg('comingSoon'),
    },
    outro: {
      ...template.outro,
      ...rawSeqBg('outro'),
    },
  }
}

// ============================================================================
// Utility: merge partial config onto defaults
// ============================================================================

export function resolveConfig(initial?: VideoTemplate): ResolvedVideoTemplate {
  if (!initial) return DEFAULT_TEMPLATE

  const globalBackgroundImage = initial.global?.backgroundImage !== undefined && initial.global?.backgroundImage !== null
    ? initial.global.backgroundImage
    : DEFAULT_TEMPLATE.global.backgroundImage
  const globalBackgroundOverlayOpacity = initial.global?.backgroundOverlayOpacity !== undefined && initial.global?.backgroundOverlayOpacity !== null
    ? initial.global.backgroundOverlayOpacity
    : DEFAULT_TEMPLATE.global.backgroundOverlayOpacity

  const resolved: ResolvedVideoTemplate = {
    global: {
      colors: { ...DEFAULT_TEMPLATE.global.colors, ...initial.global?.colors },
      fonts: { ...DEFAULT_TEMPLATE.global.fonts, ...initial.global?.fonts },
      timing: { ...DEFAULT_TEMPLATE.global.timing, ...initial.global?.timing },
      backgroundImage: globalBackgroundImage,
      backgroundOverlayOpacity: globalBackgroundOverlayOpacity,
    },
    intro: { ...DEFAULT_TEMPLATE.intro, ...initial.intro, backgroundOverlayOpacity: initial.intro?.backgroundOverlayOpacity ?? DEFAULT_TEMPLATE.intro.backgroundOverlayOpacity },
    bookReveal: { ...DEFAULT_TEMPLATE.bookReveal, ...initial.bookReveal, backgroundOverlayOpacity: initial.bookReveal?.backgroundOverlayOpacity ?? DEFAULT_TEMPLATE.bookReveal.backgroundOverlayOpacity },
    statsReveal: { ...DEFAULT_TEMPLATE.statsReveal, ...initial.statsReveal, backgroundOverlayOpacity: initial.statsReveal?.backgroundOverlayOpacity ?? DEFAULT_TEMPLATE.statsReveal.backgroundOverlayOpacity },
    comingSoon: { ...DEFAULT_TEMPLATE.comingSoon, ...initial.comingSoon, backgroundOverlayOpacity: initial.comingSoon?.backgroundOverlayOpacity ?? DEFAULT_TEMPLATE.comingSoon.backgroundOverlayOpacity },
    outro: { ...DEFAULT_TEMPLATE.outro, ...initial.outro, backgroundOverlayOpacity: initial.outro?.backgroundOverlayOpacity ?? DEFAULT_TEMPLATE.outro.backgroundOverlayOpacity },
  }

  // Apply global-to-sequence fallback for background image fields
  const sequences = ['intro', 'bookReveal', 'statsReveal', 'comingSoon', 'outro'] as const
  for (const seq of sequences) {
    const seqConfig = resolved[seq] as unknown as Record<string, unknown>
    const sourceSeqConfig = initial[seq] as Record<string, unknown> | undefined

    if (sourceSeqConfig?.backgroundImage !== undefined && sourceSeqConfig.backgroundImage !== null) {
      seqConfig.backgroundImage = sourceSeqConfig.backgroundImage
    } else {
      seqConfig.backgroundImage = globalBackgroundImage
    }

    if (sourceSeqConfig?.backgroundOverlayOpacity !== undefined && sourceSeqConfig.backgroundOverlayOpacity !== null) {
      seqConfig.backgroundOverlayOpacity = sourceSeqConfig.backgroundOverlayOpacity
    } else {
      seqConfig.backgroundOverlayOpacity = globalBackgroundOverlayOpacity
    }
  }

  return resolved
}

// ============================================================================
// Utility: assemble config from editor state
// ============================================================================

export function assembleConfig(state: EditorState, assembleFullTimingConfigFn: typeof assembleFullTimingConfig): VideoTemplate {
  const timing = assembleFullTimingConfigFn(state.timingTotals)

  return {
    global: {
      colors: { ...state.colors },
      fonts: { ...state.fonts },
      timing,
      backgroundImage: state.globalBackgroundImage,
      backgroundOverlayOpacity: state.globalBackgroundOverlayOpacity,
    },
    intro: {
      layout: state.intro.layout,
      titleFontSize: state.intro.titleFontSize,
      subtitleFontSize: state.intro.subtitleFontSize,
      showYear: state.intro.showYear,
      backgroundImage: state.intro.backgroundImage,
      backgroundOverlayOpacity: state.intro.backgroundOverlayOpacity,
    },
    bookReveal: {
      layout: state.bookReveal.layout,
      showRatings: state.bookReveal.showRatings,
      showAuthors: state.bookReveal.showAuthors,
      coverSize: state.bookReveal.coverSize,
      animationStyle: state.bookReveal.animationStyle,
      backgroundImage: state.bookReveal.backgroundImage,
      backgroundOverlayOpacity: state.bookReveal.backgroundOverlayOpacity,
    },
    statsReveal: {
      layout: state.statsReveal.layout,
      showTotalBooks: state.statsReveal.showTotalBooks,
      showTotalPages: state.statsReveal.showTotalPages,
      showAverageRating: state.statsReveal.showAverageRating,
      showTopBook: state.statsReveal.showTopBook,
      animateNumbers: state.statsReveal.animateNumbers,
      backgroundImage: state.statsReveal.backgroundImage,
      backgroundOverlayOpacity: state.statsReveal.backgroundOverlayOpacity,
    },
    comingSoon: {
      layout: state.comingSoon.layout,
      showProgress: state.comingSoon.showProgress,
      maxBooks: state.comingSoon.maxBooks,
      backgroundImage: state.comingSoon.backgroundImage,
      backgroundOverlayOpacity: state.comingSoon.backgroundOverlayOpacity,
    },
    outro: {
      layout: state.outro.layout,
      showBranding: state.outro.showBranding,
      customText: state.outro.customText,
      backgroundImage: state.outro.backgroundImage,
      backgroundOverlayOpacity: state.outro.backgroundOverlayOpacity,
    },
  }
}

// ============================================================================
// Utility: formatColorLabel (reused from TemplateDetailClient)
// ============================================================================

function formatColorLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

// ============================================================================
// Utility: map validation error path to tab key
// ============================================================================

function errorPathToTab(path: string): TabKey | null {
  if (path.startsWith('global.colors')) return 'colors'
  if (path.startsWith('global.fonts')) return 'fonts'
  if (path.startsWith('global.timing')) return 'timing'
  if (path.startsWith('intro')) return 'intro'
  if (path.startsWith('bookReveal')) return 'bookReveal'
  if (path.startsWith('statsReveal')) return 'statsReveal'
  if (path.startsWith('comingSoon')) return 'comingSoon'
  if (path.startsWith('outro')) return 'outro'
  return null
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
// Timing Sequence Definitions for Display
// ============================================================================

const TIMING_SEQUENCES: {
  label: string
  totalKey: 'introTotal' | 'bookTotal' | 'statsTotal' | 'comingSoonTotal' | 'outroTotal'
  calcKey: 'intro' | 'book' | 'stats' | 'comingSoon' | 'outro'
}[] = [
  { label: 'Intro Total', totalKey: 'introTotal', calcKey: 'intro' },
  { label: 'Book Total', totalKey: 'bookTotal', calcKey: 'book' },
  { label: 'Stats Total', totalKey: 'statsTotal', calcKey: 'stats' },
  { label: 'Coming Soon Total', totalKey: 'comingSoonTotal', calcKey: 'comingSoon' },
  { label: 'Outro Total', totalKey: 'outroTotal', calcKey: 'outro' },
]

// ============================================================================
// Main Component
// ============================================================================

export default function TemplateEditorClient({
  mode,
  initialConfig,
  templateId,
  initialName,
  initialDescription,
  initialIsPublished,
}: TemplateEditorClientProps) {
  const router = useRouter()
  const resolved = resolveConfig(initialConfig)
  const [state, dispatch] = useReducer(editorReducer, buildInitialState(resolved, initialConfig))

  // Metadata fields
  const [name, setName] = useState(initialName ?? '')
  const [description, setDescription] = useState(initialDescription ?? '')
  const [isPublished, setIsPublished] = useState(initialIsPublished ?? false)

  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('colors')

  // Save state
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [apiError, setApiError] = useState<string | null>(null)

  // Delete state (for edit mode)
  const [deleting, setDeleting] = useState(false)

  // Background upload state
  const [uploadingBackground, setUploadingBackground] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const globalFileInputRef = useRef<HTMLInputElement>(null)

  // Assemble the full VideoTemplate config from state
  const assembleConfigFromState = useCallback((): VideoTemplate => {
    return assembleConfig(state, assembleFullTimingConfig)
  }, [state])

  // ============================================================================
  // Background Image Upload Flow
  // ============================================================================

  const handleBackgroundUpload = async (
    file: File,
    sequence: 'global' | 'intro' | 'bookReveal' | 'statsReveal' | 'comingSoon' | 'outro'
  ) => {
    if (!templateId) {
      setUploadError('Please save the template first before uploading background images.')
      return
    }

    setUploadingBackground(sequence)
    setUploadError(null)

    try {
      // Step 1: Request presigned URL
      const presignedResponse = await fetch(`/api/templates/${templateId}/background/presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type,
          fileSize: file.size,
          sequence,
        }),
      })

      if (!presignedResponse.ok) {
        const data = await presignedResponse.json()
        throw new Error(data.error || 'Failed to get upload URL')
      }

      const { presignedUrl, key } = await presignedResponse.json()

      // Step 2: Upload file directly to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to S3')
      }

      // Step 3: Process the uploaded image (resize)
      const processResponse = await fetch(`/api/templates/${templateId}/background`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, sequence }),
      })

      if (!processResponse.ok) {
        const data = await processResponse.json()
        throw new Error(data.error || 'Failed to process background image')
      }

      const { backgroundUrl } = await processResponse.json()

      // Step 4: Dispatch URL into editor state
      if (sequence === 'global') {
        dispatch({ type: 'SET_GLOBAL_BACKGROUND_IMAGE', value: backgroundUrl })
      } else {
        const actionType = SEQUENCE_ACTION_MAP[sequence]
        dispatch({ type: actionType, key: 'backgroundImage', value: backgroundUrl })
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingBackground(null)
    }
  }

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    sequence: 'global' | 'intro' | 'bookReveal' | 'statsReveal' | 'comingSoon' | 'outro'
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      handleBackgroundUpload(file, sequence)
    }
    // Reset the input so re-selecting the same file triggers onChange
    e.target.value = ''
  }

  // Save handler
  const handleSave = async () => {
    setErrors([])
    setApiError(null)

    if (!name.trim()) {
      setApiError('Template name is required.')
      return
    }

    const config = assembleConfigFromState()

    // Client-side validation
    const validation = validateTemplateConfig(config)
    if (!validation.valid) {
      setErrors(validation.errors)
      // Switch to the tab containing the first error
      if (validation.errors.length > 0) {
        const firstErrorTab = errorPathToTab(validation.errors[0].path)
        if (firstErrorTab) {
          setActiveTab(firstErrorTab)
        }
      }
      return
    }

    setSaving(true)
    try {
      const endpoint = mode === 'create'
        ? '/api/templates'
        : `/api/templates/${templateId}`

      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          config,
          isPublished,
        }),
      })

      if (response.ok) {
        router.push('/dashboard/templates')
      } else {
        const data = await response.json()
        setApiError(data.error || 'Failed to save template.')
        if (data.validationErrors) {
          setErrors(data.validationErrors)
        }
      }
    } catch {
      setApiError('An error occurred while saving. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Delete handler (edit mode only)
  const handleDelete = async () => {
    if (!templateId) return
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    setApiError(null)
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/templates')
      } else {
        const data = await response.json()
        setApiError(data.error || 'Failed to delete template.')
      }
    } catch {
      setApiError('An error occurred while deleting. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  // ============================================================================
  // Render: Background Image Section (reusable for global and per-sequence)
  // ============================================================================

  const renderBackgroundImageSection = (
    sequence: 'global' | 'intro' | 'bookReveal' | 'statsReveal' | 'comingSoon' | 'outro',
    currentImage: string | null,
    currentOpacity: number | null,
    isInheriting: boolean,
    globalImage: string | null
  ) => {
    const prefix = sequence
    const isGlobal = sequence === 'global'
    const effectiveOpacity = currentOpacity ?? state.globalBackgroundOverlayOpacity
    const isUploading = uploadingBackground === sequence

    return (
      <div className="border-t border-border pt-4 mt-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Background Image</h3>

        {/* Upload disabled in create mode */}
        {!templateId && (
          <p className="text-xs text-muted-foreground mb-3">
            Save the template first to upload background images.
          </p>
        )}

        {/* File upload input */}
        <div className="mb-3">
          <input
            ref={isGlobal ? globalFileInputRef : undefined}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e, sequence)}
            disabled={!templateId || isUploading}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:text-sm file:font-medium file:bg-card file:text-card-foreground hover:file:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid={`${prefix}-background-upload`}
          />
        </div>

        {/* Loading indicator */}
        {isUploading && (
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Uploading...
          </div>
        )}

        {/* Thumbnail preview */}
        {currentImage && !isInheriting && (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={`${sequence} background preview`}
              className="w-24 h-[42px] object-cover rounded border border-border"
              data-testid={`${prefix}-background-preview`}
            />
          </div>
        )}

        {/* Inheriting from global indicator */}
        {!isGlobal && isInheriting && globalImage && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Inheriting from global</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={globalImage}
              alt="Inherited global background"
              className="w-24 h-[42px] object-cover rounded border border-border opacity-50"
              data-testid={`${prefix}-background-preview`}
            />
          </div>
        )}

        {/* Overlay opacity slider */}
        <div className="mb-3">
          <label className="text-xs text-muted-foreground block mb-1">
            Overlay Opacity: {effectiveOpacity.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={effectiveOpacity}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              if (isGlobal) {
                dispatch({ type: 'SET_GLOBAL_BACKGROUND_OVERLAY_OPACITY', value: val })
              } else {
                const actionType = SEQUENCE_ACTION_MAP[sequence]
                dispatch({ type: actionType, key: 'backgroundOverlayOpacity', value: val })
              }
            }}
            className="w-full"
            data-testid={`${prefix}-background-opacity`}
          />
        </div>

        {/* Remove / Clear override button */}
        {isGlobal && currentImage && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_GLOBAL_BACKGROUND_IMAGE', value: null })}
            className="text-xs text-red-500 hover:text-red-400 transition-colors"
            data-testid={`${prefix}-background-remove`}
          >
            Remove background image
          </button>
        )}

        {!isGlobal && !isInheriting && currentImage && (
          <button
            type="button"
            onClick={() => {
              const actionType = SEQUENCE_ACTION_MAP[sequence]
              dispatch({ type: actionType, key: 'backgroundImage', value: null })
              dispatch({ type: actionType, key: 'backgroundOverlayOpacity', value: null })
            }}
            className="text-xs text-red-500 hover:text-red-400 transition-colors"
            data-testid={`${prefix}-background-remove`}
          >
            Clear override (inherit from global)
          </button>
        )}
      </div>
    )
  }

  // ============================================================================
  // Render: Colors Tab
  // ============================================================================

  const renderColorsTab = () => (
    <div className="space-y-6" data-testid="colors-tab-panel">
      {COLOR_GROUPS.map((group) => (
        <div key={group.heading}>
          <h3 className="text-sm font-semibold text-foreground mb-3">{group.heading}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.keys.map((colorKey) => (
              <div key={colorKey} className="flex items-center gap-3">
                <input
                  type="color"
                  value={state.colors[colorKey].startsWith('rgba') ? '#000000' : state.colors[colorKey]}
                  onChange={(e) =>
                    dispatch({ type: 'SET_COLOR', key: colorKey, value: e.target.value })
                  }
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer shrink-0"
                  data-testid={`color-picker-${colorKey}`}
                />
                <div className="flex-1 min-w-0">
                  <label className="text-xs text-muted-foreground block mb-1">
                    {formatColorLabel(colorKey)}
                  </label>
                  <input
                    type="text"
                    value={state.colors[colorKey]}
                    onChange={(e) =>
                      dispatch({ type: 'SET_COLOR', key: colorKey, value: e.target.value })
                    }
                    className="w-full px-2 py-1 text-sm rounded border border-border bg-card text-card-foreground font-mono"
                    data-testid={`color-text-${colorKey}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Global Background Image Section */}
      {renderBackgroundImageSection(
        'global',
        state.globalBackgroundImage,
        state.globalBackgroundOverlayOpacity,
        false,
        null
      )}
    </div>
  )

  // ============================================================================
  // Render: Fonts Tab
  // ============================================================================

  const renderFontsTab = () => (
    <div className="space-y-6" data-testid="fonts-tab-panel">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Heading Font</label>
        <input
          type="text"
          value={state.fonts.heading}
          onChange={(e) => dispatch({ type: 'SET_FONT', key: 'heading', value: e.target.value })}
          placeholder="Inter, system-ui, sans-serif"
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
          data-testid="font-heading-input"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Body Font</label>
        <input
          type="text"
          value={state.fonts.body}
          onChange={(e) => dispatch({ type: 'SET_FONT', key: 'body', value: e.target.value })}
          placeholder="Inter, system-ui, sans-serif"
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
          data-testid="font-body-input"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Mono Font</label>
        <input
          type="text"
          value={state.fonts.mono}
          onChange={(e) => dispatch({ type: 'SET_FONT', key: 'mono', value: e.target.value })}
          placeholder="JetBrains Mono, monospace"
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
          data-testid="font-mono-input"
        />
      </div>
    </div>
  )

  // ============================================================================
  // Render: Timing Tab
  // ============================================================================

  const renderTimingTab = () => (
    <div className="space-y-6" data-testid="timing-tab-panel">
      {TIMING_SEQUENCES.map(({ label, totalKey, calcKey }) => {
        const total = state.timingTotals[totalKey]
        const subTimings = calculateSubTimings(calcKey, total)
        return (
          <div key={totalKey} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-4 mb-3">
              <label className="text-sm font-semibold text-foreground min-w-[120px]">{label}</label>
              <input
                type="number"
                value={total}
                onChange={(e) =>
                  dispatch({ type: 'SET_TIMING_TOTAL', key: totalKey, value: Math.max(1, parseInt(e.target.value) || 0) })
                }
                className="w-24 px-3 py-1.5 rounded border border-border bg-card text-card-foreground text-sm"
                min={1}
                data-testid={`timing-${totalKey}`}
              />
              <span className="text-xs text-muted-foreground">
                {(total / 30).toFixed(1)}s
              </span>
            </div>
            <div className="flex flex-wrap gap-3 pl-4">
              {Object.entries(subTimings).map(([key, value]) => (
                <div key={key} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {formatColorLabel(key.replace(/^(intro|book|stats|comingSoon|outro)/, ''))}: {value} ({(value / 30).toFixed(2)}s)
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Transition Overlap */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-semibold text-foreground min-w-[120px]">Transition Overlap</label>
          <input
            type="number"
            value={state.timingTotals.transitionOverlap}
            onChange={(e) =>
              dispatch({ type: 'SET_TIMING_TOTAL', key: 'transitionOverlap', value: Math.max(0, parseInt(e.target.value) || 0) })
            }
            className="w-24 px-3 py-1.5 rounded border border-border bg-card text-card-foreground text-sm"
            min={0}
            data-testid="timing-transitionOverlap"
          />
          <span className="text-xs text-muted-foreground">
            {(state.timingTotals.transitionOverlap / 30).toFixed(2)}s
          </span>
        </div>
      </div>
    </div>
  )

  // ============================================================================
  // Render: Intro Tab
  // ============================================================================

  const renderIntroTab = () => {
    const hasOwnImage = state.intro.backgroundImage !== null
    return (
      <div className="space-y-6" data-testid="intro-tab-panel">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Intro Layout</label>
          <select
            value={state.intro.layout}
            onChange={(e) => dispatch({ type: 'SET_INTRO', key: 'layout', value: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
            data-testid="intro-layout-select"
          >
            <option value="centered">Centered</option>
            <option value="split">Split</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Title Font Size</label>
          <input
            type="number"
            value={state.intro.titleFontSize}
            onChange={(e) => dispatch({ type: 'SET_INTRO', key: 'titleFontSize', value: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
            min={1}
            data-testid="intro-titleFontSize"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Subtitle Font Size</label>
          <input
            type="number"
            value={state.intro.subtitleFontSize}
            onChange={(e) => dispatch({ type: 'SET_INTRO', key: 'subtitleFontSize', value: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
            min={1}
            data-testid="intro-subtitleFontSize"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-foreground">Show Year</label>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_INTRO', key: 'showYear', value: !state.intro.showYear })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              state.intro.showYear ? 'bg-primary' : 'bg-muted'
            }`}
            role="switch"
            aria-checked={state.intro.showYear}
            data-testid="intro-showYear-toggle"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                state.intro.showYear ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Background Image Section */}
        {renderBackgroundImageSection(
          'intro',
          state.intro.backgroundImage,
          state.intro.backgroundOverlayOpacity,
          !hasOwnImage,
          state.globalBackgroundImage
        )}
      </div>
    )
  }

  // ============================================================================
  // Render: Book Reveal Tab
  // ============================================================================

  const renderBookRevealTab = () => {
    const hasOwnImage = state.bookReveal.backgroundImage !== null
    return (
      <div className="space-y-6" data-testid="bookReveal-tab-panel">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Book Reveal Layout</label>
          <select
            value={state.bookReveal.layout}
            onChange={(e) => dispatch({ type: 'SET_BOOK_REVEAL', key: 'layout', value: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
            data-testid="bookReveal-layout-select"
          >
            <option value="sequential">Sequential</option>
            <option value="grid">Grid</option>
            <option value="carousel">Carousel</option>
          </select>
        </div>

        {/* Toggle: showRatings */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-foreground">Show Ratings</label>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_BOOK_REVEAL', key: 'showRatings', value: !state.bookReveal.showRatings })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              state.bookReveal.showRatings ? 'bg-primary' : 'bg-muted'
            }`}
            role="switch"
            aria-checked={state.bookReveal.showRatings}
            data-testid="bookReveal-showRatings-toggle"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${state.bookReveal.showRatings ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Toggle: showAuthors */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-foreground">Show Authors</label>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_BOOK_REVEAL', key: 'showAuthors', value: !state.bookReveal.showAuthors })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              state.bookReveal.showAuthors ? 'bg-primary' : 'bg-muted'
            }`}
            role="switch"
            aria-checked={state.bookReveal.showAuthors}
            data-testid="bookReveal-showAuthors-toggle"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${state.bookReveal.showAuthors ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Cover Size */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Cover Size</label>
          <select
            value={state.bookReveal.coverSize}
            onChange={(e) => dispatch({ type: 'SET_BOOK_REVEAL', key: 'coverSize', value: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
            data-testid="bookReveal-coverSize-select"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>

        {/* Animation Style */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Animation Style</label>
          <select
            value={state.bookReveal.animationStyle}
            onChange={(e) => dispatch({ type: 'SET_BOOK_REVEAL', key: 'animationStyle', value: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
            data-testid="bookReveal-animationStyle-select"
          >
            <option value="slide">Slide</option>
            <option value="fade">Fade</option>
            <option value="pop">Pop</option>
          </select>
        </div>

        {/* Background Image Section */}
        {renderBackgroundImageSection(
          'bookReveal',
          state.bookReveal.backgroundImage,
          state.bookReveal.backgroundOverlayOpacity,
          !hasOwnImage,
          state.globalBackgroundImage
        )}
      </div>
    )
  }

  // ============================================================================
  // Render: Stats Reveal Tab
  // ============================================================================

  const renderStatsRevealTab = () => {
    const boolFields: { key: string; label: string }[] = [
      { key: 'showTotalBooks', label: 'Show Total Books' },
      { key: 'showTotalPages', label: 'Show Total Pages' },
      { key: 'showAverageRating', label: 'Show Average Rating' },
      { key: 'showTopBook', label: 'Show Top Book' },
      { key: 'animateNumbers', label: 'Animate Numbers' },
    ]

    const hasOwnImage = state.statsReveal.backgroundImage !== null

    return (
      <div className="space-y-6" data-testid="statsReveal-tab-panel">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Stats Reveal Layout</label>
          <select
            value={state.statsReveal.layout}
            onChange={(e) => dispatch({ type: 'SET_STATS_REVEAL', key: 'layout', value: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
            data-testid="statsReveal-layout-select"
          >
            <option value="stacked">Stacked</option>
            <option value="horizontal">Horizontal</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>

        {boolFields.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-3">
            <label className="text-sm font-semibold text-foreground">{label}</label>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_STATS_REVEAL', key, value: !(state.statsReveal as Record<string, unknown>)[key] })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                (state.statsReveal as Record<string, unknown>)[key] ? 'bg-primary' : 'bg-muted'
              }`}
              role="switch"
              aria-checked={Boolean((state.statsReveal as Record<string, unknown>)[key])}
              data-testid={`statsReveal-${key}-toggle`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(state.statsReveal as Record<string, unknown>)[key] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}

        {/* Background Image Section */}
        {renderBackgroundImageSection(
          'statsReveal',
          state.statsReveal.backgroundImage,
          state.statsReveal.backgroundOverlayOpacity,
          !hasOwnImage,
          state.globalBackgroundImage
        )}
      </div>
    )
  }

  // ============================================================================
  // Render: Coming Soon Tab
  // ============================================================================

  const renderComingSoonTab = () => {
    const hasOwnImage = state.comingSoon.backgroundImage !== null
    return (
      <div className="space-y-6" data-testid="comingSoon-tab-panel">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Coming Soon Layout</label>
          <select
            value={state.comingSoon.layout}
            onChange={(e) => dispatch({ type: 'SET_COMING_SOON', key: 'layout', value: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
            data-testid="comingSoon-layout-select"
          >
            <option value="list">List</option>
            <option value="grid">Grid</option>
            <option value="single">Single</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-foreground">Show Progress</label>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_COMING_SOON', key: 'showProgress', value: !state.comingSoon.showProgress })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              state.comingSoon.showProgress ? 'bg-primary' : 'bg-muted'
            }`}
            role="switch"
            aria-checked={state.comingSoon.showProgress}
            data-testid="comingSoon-showProgress-toggle"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${state.comingSoon.showProgress ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Max Books</label>
          <input
            type="number"
            value={state.comingSoon.maxBooks}
            onChange={(e) => dispatch({ type: 'SET_COMING_SOON', key: 'maxBooks', value: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
            min={1}
            data-testid="comingSoon-maxBooks"
          />
        </div>

        {/* Background Image Section */}
        {renderBackgroundImageSection(
          'comingSoon',
          state.comingSoon.backgroundImage,
          state.comingSoon.backgroundOverlayOpacity,
          !hasOwnImage,
          state.globalBackgroundImage
        )}
      </div>
    )
  }

  // ============================================================================
  // Render: Outro Tab
  // ============================================================================

  const renderOutroTab = () => {
    const hasOwnImage = state.outro.backgroundImage !== null
    return (
      <div className="space-y-6" data-testid="outro-tab-panel">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Outro Layout</label>
          <select
            value={state.outro.layout}
            onChange={(e) => dispatch({ type: 'SET_OUTRO', key: 'layout', value: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
            data-testid="outro-layout-select"
          >
            <option value="centered">Centered</option>
            <option value="minimal">Minimal</option>
            <option value="branded">Branded</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-foreground">Show Branding</label>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_OUTRO', key: 'showBranding', value: !state.outro.showBranding })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              state.outro.showBranding ? 'bg-primary' : 'bg-muted'
            }`}
            role="switch"
            aria-checked={state.outro.showBranding}
            data-testid="outro-showBranding-toggle"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${state.outro.showBranding ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Custom Text</label>
          <input
            type="text"
            value={state.outro.customText}
            onChange={(e) => dispatch({ type: 'SET_OUTRO', key: 'customText', value: e.target.value })}
            placeholder="Enter custom outro text..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
            data-testid="outro-customText"
          />
        </div>

        {/* Background Image Section */}
        {renderBackgroundImageSection(
          'outro',
          state.outro.backgroundImage,
          state.outro.backgroundOverlayOpacity,
          !hasOwnImage,
          state.globalBackgroundImage
        )}
      </div>
    )
  }

  // ============================================================================
  // Tab Panel Renderer
  // ============================================================================

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'colors': return renderColorsTab()
      case 'fonts': return renderFontsTab()
      case 'timing': return renderTimingTab()
      case 'intro': return renderIntroTab()
      case 'bookReveal': return renderBookRevealTab()
      case 'statsReveal': return renderStatsRevealTab()
      case 'comingSoon': return renderComingSoonTab()
      case 'outro': return renderOutroTab()
      default: return null
    }
  }

  // ============================================================================
  // Construct backgroundImages prop for preview panel (Task 4.6)
  // ============================================================================

  const backgroundImages = {
    global: state.globalBackgroundImage,
    intro: state.intro.backgroundImage || state.globalBackgroundImage,
    bookReveal: state.bookReveal.backgroundImage || state.globalBackgroundImage,
    statsReveal: state.statsReveal.backgroundImage || state.globalBackgroundImage,
    comingSoon: state.comingSoon.backgroundImage || state.globalBackgroundImage,
    outro: state.outro.backgroundImage || state.globalBackgroundImage,
  }

  const backgroundOpacities = {
    global: state.globalBackgroundOverlayOpacity,
    intro: state.intro.backgroundOverlayOpacity ?? state.globalBackgroundOverlayOpacity,
    bookReveal: state.bookReveal.backgroundOverlayOpacity ?? state.globalBackgroundOverlayOpacity,
    statsReveal: state.statsReveal.backgroundOverlayOpacity ?? state.globalBackgroundOverlayOpacity,
    comingSoon: state.comingSoon.backgroundOverlayOpacity ?? state.globalBackgroundOverlayOpacity,
    outro: state.outro.backgroundOverlayOpacity ?? state.globalBackgroundOverlayOpacity,
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div>
      {/* Metadata Fields */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Template Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter template name..."
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground"
            data-testid="template-name-input"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-card-foreground resize-none"
            data-testid="template-description-input"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-foreground">Published</label>
          <button
            type="button"
            onClick={() => setIsPublished(!isPublished)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isPublished ? 'bg-primary' : 'bg-muted'
            }`}
            role="switch"
            aria-checked={isPublished}
            data-testid="template-isPublished-toggle"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isPublished ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Two-column layout: editor (left) + preview (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Column */}
        <div className="lg:col-span-2">
          {/* Tab Buttons */}
          <div className="flex flex-wrap gap-1 mb-6 border-b border-border pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Upload Error Display */}
          {uploadError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
            </div>
          )}

          {/* Active Panel */}
          <div className="min-h-[400px]">
            {renderActivePanel()}
          </div>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 bg-card border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Preview</h2>
            <TemplatePreviewPanel
              colors={state.colors}
              fonts={state.fonts}
              timingTotals={state.timingTotals}
              layouts={{
                intro: state.intro.layout,
                bookReveal: state.bookReveal.layout,
                statsReveal: state.statsReveal.layout,
                comingSoon: state.comingSoon.layout,
                outro: state.outro.layout,
              }}
              backgroundImages={backgroundImages}
              backgroundOpacities={backgroundOpacities}
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {(errors.length > 0 || apiError) && (
        <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" data-testid="editor-errors">
          {apiError && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">{apiError}</p>
          )}
          {errors.length > 0 && (
            <ul className="space-y-1">
              {errors.map((err, i) => (
                <li key={i} className="text-sm text-red-600 dark:text-red-400">
                  <span className="font-medium">{err.path}:</span> {err.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Sticky Save Footer */}
      <div className="sticky bottom-0 mt-8 py-4 bg-background border-t border-border -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            {mode === 'edit' && templateId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2.5 text-sm font-medium rounded-lg border border-red-300 text-red-600 bg-card hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="delete-template-btn"
              >
                {deleting ? 'Deleting...' : 'Delete Template'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/templates')}
              className="px-4 py-2.5 text-sm font-medium rounded-lg border border-border text-card-foreground bg-card hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              data-testid="save-template-btn"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                `Save Template`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
