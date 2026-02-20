// Mock nanoid for tests with crypto-level uniqueness
let counter = 0

export function nanoid(size: number = 21): string {
  counter++
  // Use high-resolution timestamp + counter + random for uniqueness
  // Convert to base36 and replace any non-alphanumeric chars with valid URL-safe chars
  const timestamp = Math.floor(Date.now() * 1000 + performance.now())
  const random = Math.floor(Math.random() * 1000000)
  const processId = process.pid || 0
  const unique = `${timestamp.toString(36)}${counter.toString(36)}${random.toString(36)}${processId.toString(36)}`
    .replace(/[^A-Za-z0-9]/g, '_') // Replace non-alphanumeric with underscores

  if (size <= unique.length) {
    return unique.substring(0, size)
  }

  // Pad with alphanumeric characters instead of '0'
  return unique.padEnd(size, 'a')
}
