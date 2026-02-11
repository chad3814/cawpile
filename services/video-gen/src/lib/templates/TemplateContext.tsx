/**
 * Template Context Provider
 * Provides template configuration to all video components via React Context
 */

import React, { createContext, useContext, useMemo } from 'react'
import type { VideoTemplate } from '@/lib/types'

interface TemplateContextValue {
  template: VideoTemplate
  colors: VideoTemplate['colors']
  fonts: VideoTemplate['fonts']
  timing: VideoTemplate['timing']
  layout: VideoTemplate['layout']
  sequences: VideoTemplate['sequences']
}

const TemplateContext = createContext<TemplateContextValue | null>(null)

interface TemplateProviderProps {
  template: VideoTemplate
  children: React.ReactNode
}

export const TemplateProvider: React.FC<TemplateProviderProps> = ({
  template,
  children,
}) => {
  const value = useMemo<TemplateContextValue>(
    () => ({
      template,
      colors: template.colors,
      fonts: template.fonts,
      timing: template.timing,
      layout: template.layout,
      sequences: template.sequences,
    }),
    [template],
  )

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  )
}

/**
 * Hook to access the full template context
 */
export function useTemplate(): TemplateContextValue {
  const context = useContext(TemplateContext)

  if (!context) {
    throw new Error('useTemplate must be used within a TemplateProvider')
  }

  return context
}

/**
 * Hook to access template colors
 */
export function useTemplateColors(): VideoTemplate['colors'] {
  const { colors } = useTemplate()
  return colors
}

/**
 * Hook to access template fonts
 */
export function useTemplateFonts(): VideoTemplate['fonts'] {
  const { fonts } = useTemplate()
  return fonts
}

/**
 * Hook to access template timing
 */
export function useTemplateTiming(): VideoTemplate['timing'] {
  const { timing } = useTemplate()
  return timing
}

/**
 * Hook to access template layout preferences
 */
export function useTemplateLayout(): VideoTemplate['layout'] {
  const { layout } = useTemplate()
  return layout
}

/**
 * Hook to access template sequence configuration
 */
export function useTemplateSequences(): VideoTemplate['sequences'] {
  const { sequences } = useTemplate()
  return sequences
}
