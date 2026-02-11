import fs from 'fs/promises'
import path from 'path'

/**
 * Delete a local file after successful S3 upload
 *
 * @param filePath - Absolute path to the file to delete
 * @returns Promise that resolves when deletion is complete
 * @throws Error if deletion fails
 */
export async function deleteLocalFile(filePath: string): Promise<void> {
  const filename = path.basename(filePath)

  try {
    await fs.unlink(filePath)
    console.log(`[Cleanup] Successfully deleted local file: ${filename}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Cleanup] Failed to delete local file ${filename}: ${errorMessage}`)
    throw new Error(`Failed to delete local file: ${errorMessage}`)
  }
}
