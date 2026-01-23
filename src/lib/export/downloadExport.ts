/**
 * Client-side utility for triggering data export downloads.
 */

import type { ExportFormat } from '@/types/export'
import { formatExportDate } from './exportUtils'

/**
 * Downloads user data export in the specified format.
 * Triggers browser download of JSON or ZIP file.
 */
export async function downloadExport(format: ExportFormat): Promise<void> {
  const response = await fetch(`/api/user/export?format=${format}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to export data')
  }

  const blob = await response.blob()
  const dateStr = formatExportDate(new Date())
  const extension = format === 'json' ? 'json' : 'zip'
  const filename = `cawpile-export-${dateStr}.${extension}`

  // Create temporary anchor element to trigger download
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename

  // Append to body (required for Firefox)
  document.body.appendChild(link)

  // Trigger download
  link.click()

  // Clean up
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
