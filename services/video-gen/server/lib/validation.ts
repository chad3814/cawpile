import type { RenderRequest, MonthlyRecapExport } from '../../src/lib/types'
import type { VideoTemplate } from '../../src/lib/template-types'
import { validateTemplate } from './template-validation'

/**
 * Result of validating a render stream query parameter
 */
export type ValidationResult =
  | { valid: true; data: RenderRequest }
  | { valid: false; error: string }

/**
 * Parse and validate the render-stream query parameters
 *
 * @param queryData - The URL-encoded JSON string from the `data` query parameter
 * @param queryUserId - The userId from the `userId` query parameter
 * @param queryTemplate - Optional URL-encoded JSON template from the `template` query parameter
 * @returns ValidationResult indicating success with parsed data or failure with error message
 */
export function parseRenderStreamQuery(
  queryData: string | undefined,
  queryUserId: string | undefined,
  queryTemplate?: string | undefined
): ValidationResult {
  // Validate userId
  if (!queryUserId) {
    return { valid: false, error: 'Invalid request: userId is required' }
  }

  if (typeof queryUserId !== 'string') {
    return { valid: false, error: 'Invalid request: userId must be a string' }
  }

  if (queryUserId.trim() === '') {
    return { valid: false, error: 'Invalid request: userId cannot be empty' }
  }

  // Check for missing data parameter
  if (queryData === undefined || queryData === '') {
    return { valid: false, error: 'Missing required query parameter: data' }
  }

  // URL-decode and parse JSON for data
  let parsedData: unknown
  try {
    const decoded = decodeURIComponent(queryData)
    parsedData = JSON.parse(decoded)
  } catch {
    return { valid: false, error: 'Invalid JSON in data parameter' }
  }

  // Validate top-level structure
  if (typeof parsedData !== 'object' || parsedData === null) {
    return { valid: false, error: 'Invalid request: expected object' }
  }

  const data = parsedData as Record<string, unknown>

  // Validate data contains required fields
  if (!data.meta) {
    return { valid: false, error: 'Invalid request: data.meta is required' }
  }

  if (!data.books) {
    return { valid: false, error: 'Invalid request: data.books is required' }
  }

  if (!data.stats) {
    return { valid: false, error: 'Invalid request: data.stats is required' }
  }

  // Parse and validate optional template
  let template: Partial<VideoTemplate> | undefined
  if (queryTemplate && queryTemplate.trim() !== '') {
    try {
      const decodedTemplate = decodeURIComponent(queryTemplate)
      const parsedTemplate = JSON.parse(decodedTemplate)

      // Validate and sanitize the template
      const validationResult = validateTemplate(parsedTemplate)
      if (validationResult.warnings.length > 0) {
        console.log(`[Validation] Template warnings: ${validationResult.warnings.join(', ')}`)
      }

      // Use the sanitized template (but pass the partial, not resolved)
      // The resolution happens later in the composition
      template = parsedTemplate as Partial<VideoTemplate>
    } catch {
      return { valid: false, error: 'Invalid JSON in template parameter' }
    }
  }

  // All validations passed - construct the RenderRequest
  const result: RenderRequest = {
    userId: queryUserId,
    data: parsedData as MonthlyRecapExport,
  }

  if (template) {
    result.template = template
  }

  return {
    valid: true,
    data: result,
  }
}
