/**
 * HTML sanitization utilities for safe rendering of book descriptions.
 * Uses regex-based approach (no external dependencies) for bundle size efficiency.
 */

/**
 * Allowed HTML tags for sanitized HTML output.
 * These tags are safe for display and commonly used in book descriptions.
 */
const ALLOWED_TAGS = ['br', 'p', 'i', 'b', 'em']

/**
 * Regex pattern to match all HTML tags.
 * Captures the tag name for filtering.
 */
const HTML_TAG_REGEX = /<(\/?)([\w]+)[^>]*\/?>/gi

/**
 * Sanitizes HTML by keeping only allowed tags and stripping all others.
 * Preserves inner text content when stripping disallowed tags.
 *
 * Allowed tags: <br>, <br/>, <p>, </p>, <i>, </i>, <b>, </b>, <em>, </em>
 *
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string with only allowed tags
 *
 * @example
 * sanitizeHtml('<b>Bold</b> <script>alert()</script> text')
 * // Returns: '<b>Bold</b> alert() text'
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) {
    return ''
  }

  // Replace all HTML tags, keeping only allowed ones (with attributes stripped)
  return html.replace(HTML_TAG_REGEX, (match, slash, tagName) => {
    const normalized = tagName.toLowerCase()
    if (ALLOWED_TAGS.includes(normalized)) {
      return `<${slash}${normalized}>`
    }
    // Strip disallowed tags but keep content (by returning empty string)
    return ''
  })
}

/**
 * Strips all HTML tags and converts to plain text.
 * Converts line break tags to newlines, then strips remaining tags.
 * Collapses multiple consecutive newlines to a single newline.
 *
 * @param html - Raw HTML string to convert to plain text
 * @returns Plain text string with HTML stripped and line breaks converted
 *
 * @example
 * stripHtmlToText('<b>Bold</b><br/>New line<p>Paragraph</p>')
 * // Returns: 'Bold\nNew line\nParagraph'
 */
export function stripHtmlToText(html: string | null | undefined): string {
  if (!html) {
    return ''
  }

  let text = html

  // Convert <br> and <br/> to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n')

  // Convert </p> and <p> to newlines (paragraph breaks)
  text = text.replace(/<\/?p\s*>/gi, '\n')

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]*>/g, '')

  // Collapse multiple consecutive newlines to single newline
  text = text.replace(/\n{2,}/g, '\n')

  // Trim leading/trailing whitespace and newlines
  text = text.trim()

  return text
}
