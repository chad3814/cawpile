/**
 * Template Context for distributing template values to components
 *
 * Provides React context and hooks for accessing resolved template values
 * throughout the composition tree.
 */

import React, { createContext, useContext, useMemo } from 'react'
import {
  getEffectiveTemplate,
  type VideoTemplate,
  type ResolvedVideoTemplate,
  type ResolvedColorsConfig,
  type ResolvedFontsConfig,
  type ResolvedTimingConfig,
  type ResolvedIntroConfig,
  type ResolvedBookRevealConfig,
  type ResolvedStatsRevealConfig,
  type ResolvedComingSoonConfig,
  type ResolvedOutroConfig,
} from './template-types'

// ============================================================================
// Types
// ============================================================================

/**
 * Context value interface - the resolved template
 */
export interface TemplateContextValue {
  template: ResolvedVideoTemplate
}

/**
 * Sequence name union for useSequenceConfig hook
 */
export type SequenceName = 'intro' | 'bookReveal' | 'statsReveal' | 'comingSoon' | 'outro'

/**
 * Map of sequence names to their resolved config types
 */
type SequenceConfigMap = {
  intro: ResolvedIntroConfig
  bookReveal: ResolvedBookRevealConfig
  statsReveal: ResolvedStatsRevealConfig
  comingSoon: ResolvedComingSoonConfig
  outro: ResolvedOutroConfig
}

// ============================================================================
// Context
// ============================================================================

/**
 * Template context with undefined default (requires provider)
 */
const TemplateContext = createContext<TemplateContextValue | undefined>(undefined)

// ============================================================================
// Provider Component
// ============================================================================

interface TemplateProviderProps {
  /**
   * Optional partial template to merge with defaults
   * If not provided or undefined, defaults will be used
   */
  template?: Partial<VideoTemplate> | null
  children: React.ReactNode
}

/**
 * Provider component that merges the provided template with defaults
 * and makes the resolved template available to all child components.
 *
 * @example
 * <TemplateProvider template={{ global: { colors: { accent: '#ff0000' } } }}>
 *   <MyComposition />
 * </TemplateProvider>
 */
export const TemplateProvider: React.FC<TemplateProviderProps> = ({
  template,
  children,
}) => {
  // Memoize the effective template to avoid recalculating on every render
  const resolvedTemplate = useMemo(() => getEffectiveTemplate(template), [template])

  const contextValue: TemplateContextValue = useMemo(
    () => ({ template: resolvedTemplate }),
    [resolvedTemplate]
  )

  return (
    <TemplateContext.Provider value={contextValue}>{children}</TemplateContext.Provider>
  )
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the full resolved template
 *
 * @throws Error if used outside of TemplateProvider
 * @returns Full resolved template with all values populated
 *
 * @example
 * const template = useTemplate()
 * const accentColor = template.global.colors.accent
 */
export function useTemplate(): ResolvedVideoTemplate {
  const context = useContext(TemplateContext)

  if (context === undefined) {
    throw new Error('useTemplate must be used within a TemplateProvider')
  }

  return context.template
}

/**
 * Convenience hook to access just the colors configuration
 *
 * @returns Resolved colors config
 *
 * @example
 * const colors = useColors()
 * const background = colors.background
 */
export function useColors(): ResolvedColorsConfig {
  const template = useTemplate()
  return template.global.colors
}

/**
 * Convenience hook to access just the fonts configuration
 *
 * @returns Resolved fonts config
 *
 * @example
 * const fonts = useFonts()
 * const heading = fonts.heading
 */
export function useFonts(): ResolvedFontsConfig {
  const template = useTemplate()
  return template.global.fonts
}

/**
 * Convenience hook to access just the timing configuration
 *
 * @returns Resolved timing config
 *
 * @example
 * const timing = useTiming()
 * const bookTotal = timing.bookTotal
 */
export function useTiming(): ResolvedTimingConfig {
  const template = useTemplate()
  return template.global.timing
}

/**
 * Hook to access a specific sequence's configuration
 *
 * @param sequenceName - Name of the sequence to get config for
 * @returns Resolved config for the specified sequence
 *
 * @example
 * const introConfig = useSequenceConfig('intro')
 * const layout = introConfig.layout
 */
export function useSequenceConfig<T extends SequenceName>(
  sequenceName: T
): SequenceConfigMap[T] {
  const template = useTemplate()
  return template[sequenceName] as SequenceConfigMap[T]
}

// ============================================================================
// Rating Color Hook (template-aware version of getRatingColor)
// ============================================================================

/**
 * Hook to get rating color based on template colors
 *
 * @returns Function that takes a rating and returns the appropriate color
 *
 * @example
 * const getRatingColor = useRatingColor()
 * const color = getRatingColor(8.5) // Returns ratingHigh color
 */
export function useRatingColor(): (rating: number) => string {
  const colors = useColors()

  return (rating: number): string => {
    if (rating >= 8) return colors.ratingHigh
    if (rating >= 5) return colors.ratingMedium
    return colors.ratingLow
  }
}

// ============================================================================
// Exports
// ============================================================================

export { TemplateContext }
