import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateAwsEnv, REQUIRED_AWS_ENV_VARS } from '../lib/validateEnv'

describe('validateAwsEnv', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset process.env before each test
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should pass validation when all required variables are present', () => {
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'
    process.env.AWS_REGION = 'us-east-1'
    process.env.S3_BUCKET_NAME = 'test-bucket'

    expect(() => validateAwsEnv()).not.toThrow()
  })

  it('should throw error listing all missing variables when multiple are missing', () => {
    // Only set one variable, leave others missing
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
    delete process.env.AWS_SECRET_ACCESS_KEY
    delete process.env.AWS_REGION
    delete process.env.S3_BUCKET_NAME

    expect(() => validateAwsEnv()).toThrow()

    try {
      validateAwsEnv()
    } catch (error) {
      const errorMessage = (error as Error).message
      // Should list all missing variables
      expect(errorMessage).toContain('AWS_SECRET_ACCESS_KEY')
      expect(errorMessage).toContain('AWS_REGION')
      expect(errorMessage).toContain('S3_BUCKET_NAME')
      // Should NOT include the one that's present
      expect(errorMessage).not.toContain('AWS_ACCESS_KEY_ID')
    }
  })

  it('should throw error when a single variable is missing', () => {
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'
    process.env.AWS_REGION = 'us-east-1'
    delete process.env.S3_BUCKET_NAME

    expect(() => validateAwsEnv()).toThrow()

    try {
      validateAwsEnv()
    } catch (error) {
      const errorMessage = (error as Error).message
      expect(errorMessage).toContain('S3_BUCKET_NAME')
    }
  })

  it('should treat empty string as missing', () => {
    process.env.AWS_ACCESS_KEY_ID = ''
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'
    process.env.AWS_REGION = 'us-east-1'
    process.env.S3_BUCKET_NAME = 'test-bucket'

    expect(() => validateAwsEnv()).toThrow()

    try {
      validateAwsEnv()
    } catch (error) {
      const errorMessage = (error as Error).message
      expect(errorMessage).toContain('AWS_ACCESS_KEY_ID')
    }
  })
})
