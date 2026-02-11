import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { deleteLocalFile } from '../lib/cleanup'

describe('deleteLocalFile', () => {
  let testDir: string
  let testFilePath: string

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `cleanup-test-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  it('should delete local file successfully', async () => {
    // Create a test file
    testFilePath = path.join(testDir, 'test-video.mp4')
    await fs.writeFile(testFilePath, 'test content')

    // Verify file exists
    const existsBefore = await fs
      .access(testFilePath)
      .then(() => true)
      .catch(() => false)
    expect(existsBefore).toBe(true)

    // Delete the file
    await deleteLocalFile(testFilePath)

    // Verify file is deleted
    const existsAfter = await fs
      .access(testFilePath)
      .then(() => true)
      .catch(() => false)
    expect(existsAfter).toBe(false)
  })

  it('should throw error when file does not exist', async () => {
    const nonExistentPath = path.join(testDir, 'non-existent-file.mp4')

    await expect(deleteLocalFile(nonExistentPath)).rejects.toThrow()
  })

  it('should log success message when file is deleted', async () => {
    // Create a test file
    testFilePath = path.join(testDir, 'logged-video.mp4')
    await fs.writeFile(testFilePath, 'test content')

    // Spy on console.log
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await deleteLocalFile(testFilePath)

    // Verify log was called with cleanup message
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[Cleanup]'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('logged-video.mp4'))

    logSpy.mockRestore()
  })
})
