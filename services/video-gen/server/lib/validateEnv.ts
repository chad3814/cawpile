/**
 * Required AWS environment variables for S3 integration
 */
export const REQUIRED_AWS_ENV_VARS = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'S3_BUCKET_NAME',
] as const

/**
 * Validates that all required AWS environment variables are present.
 * Fails fast at startup with a descriptive error listing all missing variables.
 *
 * @throws Error if any required environment variable is missing or empty
 */
export function validateAwsEnv(): void {
  const missingVars: string[] = []

  for (const varName of REQUIRED_AWS_ENV_VARS) {
    const value = process.env[varName]
    if (!value || value.trim() === '') {
      missingVars.push(varName)
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required AWS environment variables: ${missingVars.join(', ')}. ` +
        'Please set all required environment variables before starting the server.'
    )
  }
}
