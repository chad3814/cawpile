/**
 * Copy text to clipboard using modern API with fallback
 * @param text - Text to copy to clipboard
 * @returns Promise that resolves to true on success, false on failure
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern clipboard API (preferred)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    } catch {
      document.body.removeChild(textArea)
      return false
    }
  } catch (error) {
    console.error('Failed to copy text to clipboard:', error)
    return false
  }
}
