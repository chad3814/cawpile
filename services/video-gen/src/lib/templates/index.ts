/**
 * Template system exports
 * Automatically registers default template on module load
 */

import { templateRegistry } from './registry'
import defaultTemplate from './default.json'
import type { VideoTemplate } from '@/lib/types'

// Register default template on module load
templateRegistry.register(defaultTemplate as VideoTemplate)

export { templateRegistry }
export { TemplateRegistry } from './registry'
export {
  TemplateProvider,
  useTemplate,
  useTemplateColors,
  useTemplateFonts,
  useTemplateTiming,
  useTemplateLayout,
  useTemplateSequences,
} from './TemplateContext'
export type { VideoTemplate } from '@/lib/types'
