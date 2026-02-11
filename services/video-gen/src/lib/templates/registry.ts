/**
 * Template Registry
 * Manages video templates with validation and lookup capabilities
 */

import type { VideoTemplate } from '@/lib/types'

export class TemplateRegistry {
  private templates: Map<string, VideoTemplate> = new Map()
  private defaultTemplateId: string = 'default'

  /**
   * Register a template in the registry
   */
  register(template: VideoTemplate): void {
    if (!this.validate(template)) {
      throw new Error(
        `Invalid template: ${template.id}. Template failed validation.`,
      )
    }

    this.templates.set(template.id, template)
  }

  /**
   * Get a template by ID
   */
  get(id: string): VideoTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * Get the default template
   */
  getDefault(): VideoTemplate {
    const defaultTemplate = this.templates.get(this.defaultTemplateId)

    if (!defaultTemplate) {
      throw new Error(
        'Default template not found. Ensure the default template is registered.',
      )
    }

    return defaultTemplate
  }

  /**
   * Set the default template ID
   */
  setDefault(id: string): void {
    if (!this.templates.has(id)) {
      throw new Error(
        `Cannot set default template: template with id "${id}" not found`,
      )
    }
    this.defaultTemplateId = id
  }

  /**
   * List all registered templates
   */
  list(): VideoTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * Check if a template exists
   */
  has(id: string): boolean {
    return this.templates.has(id)
  }

  /**
   * Validate a template structure
   * Basic validation - checks for required fields and types
   */
  validate(template: VideoTemplate): boolean {
    try {
      // Check required top-level fields
      if (
        !template.id ||
        typeof template.id !== 'string' ||
        template.id.trim() === ''
      ) {
        console.error('Template validation failed: invalid or missing id')
        return false
      }

      if (
        !template.name ||
        typeof template.name !== 'string' ||
        template.name.trim() === ''
      ) {
        console.error('Template validation failed: invalid or missing name')
        return false
      }

      if (
        !template.version ||
        typeof template.version !== 'string' ||
        !/^\d+\.\d+\.\d+$/.test(template.version)
      ) {
        console.error(
          'Template validation failed: invalid or missing version (expected format: X.Y.Z)',
        )
        return false
      }

      // Validate colors object
      if (!template.colors || typeof template.colors !== 'object') {
        console.error('Template validation failed: missing colors object')
        return false
      }

      const requiredColors = [
        'background',
        'backgroundSecondary',
        'backgroundTertiary',
        'textPrimary',
        'textSecondary',
        'textMuted',
        'accent',
        'accentSecondary',
        'accentMuted',
        'completed',
        'dnf',
        'ratingHigh',
        'ratingMedium',
        'ratingLow',
        'overlay',
        'grain',
      ]

      for (const color of requiredColors) {
        if (
          !(color in template.colors) ||
          typeof template.colors[color as keyof typeof template.colors] !==
            'string'
        ) {
          console.error(
            `Template validation failed: missing or invalid color "${color}"`,
          )
          return false
        }
      }

      // Validate fonts object
      if (!template.fonts || typeof template.fonts !== 'object') {
        console.error('Template validation failed: missing fonts object')
        return false
      }

      const requiredFonts = ['heading', 'body', 'mono']
      for (const font of requiredFonts) {
        if (
          !(font in template.fonts) ||
          typeof template.fonts[font as keyof typeof template.fonts] !==
            'string' ||
          template.fonts[font as keyof typeof template.fonts].trim() === ''
        ) {
          console.error(
            `Template validation failed: missing or invalid font "${font}"`,
          )
          return false
        }
      }

      // Validate timing object
      if (!template.timing || typeof template.timing !== 'object') {
        console.error('Template validation failed: missing timing object')
        return false
      }

      const requiredTimings = [
        'introFadeIn',
        'introHold',
        'introFadeOut',
        'introTotal',
        'bookSlideIn',
        'bookTitleType',
        'bookRatingCount',
        'bookHold',
        'bookExit',
        'bookTotal',
        'statsCountUp',
        'statsHold',
        'statsFadeOut',
        'statsTotal',
        'comingSoonFadeIn',
        'comingSoonHold',
        'comingSoonFadeOut',
        'comingSoonTotal',
        'outroFadeIn',
        'outroHold',
        'outroFadeOut',
        'outroTotal',
        'transitionOverlap',
      ]

      for (const timing of requiredTimings) {
        const value =
          template.timing[timing as keyof typeof template.timing]
        if (typeof value !== 'number' || value < 0) {
          console.error(
            `Template validation failed: invalid timing "${timing}" (must be a non-negative number)`,
          )
          return false
        }
      }

      // Validate layout object
      if (!template.layout || typeof template.layout !== 'object') {
        console.error('Template validation failed: missing layout object')
        return false
      }

      const validIntroStyles = ['slam', 'fadeUp', 'scaleIn', 'typewriter']
      if (!validIntroStyles.includes(template.layout.introStyle)) {
        console.error(
          `Template validation failed: invalid introStyle "${template.layout.introStyle}"`,
        )
        return false
      }

      const validBookAnimations = ['slide', 'fade', 'scale']
      if (!validBookAnimations.includes(template.layout.bookRevealAnimation)) {
        console.error(
          `Template validation failed: invalid bookRevealAnimation "${template.layout.bookRevealAnimation}"`,
        )
        return false
      }

      const validStatsAnimations = ['countUp', 'fadeIn', 'pop']
      if (!validStatsAnimations.includes(template.layout.statsAnimation)) {
        console.error(
          `Template validation failed: invalid statsAnimation "${template.layout.statsAnimation}"`,
        )
        return false
      }

      const validOutroAnimations = ['fade', 'scale', 'slide']
      if (!validOutroAnimations.includes(template.layout.outroAnimation)) {
        console.error(
          `Template validation failed: invalid outroAnimation "${template.layout.outroAnimation}"`,
        )
        return false
      }

      // Validate sequences object
      if (!template.sequences || typeof template.sequences !== 'object') {
        console.error('Template validation failed: missing sequences object')
        return false
      }

      const requiredSequences = [
        'intro',
        'bookReveal',
        'stats',
        'comingSoon',
        'outro',
      ]
      for (const seq of requiredSequences) {
        if (
          !(seq in template.sequences) ||
          typeof template.sequences[seq as keyof typeof template.sequences] !==
            'boolean'
        ) {
          console.error(
            `Template validation failed: missing or invalid sequence "${seq}" (must be boolean)`,
          )
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Template validation error:', error)
      return false
    }
  }

  /**
   * Clear all templates (useful for testing)
   */
  clear(): void {
    this.templates.clear()
  }

  /**
   * Get the number of registered templates
   */
  get size(): number {
    return this.templates.size
  }
}

// Singleton instance
export const templateRegistry = new TemplateRegistry()
