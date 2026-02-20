/**
 * Data migration script to assign default usernames to existing users without one.
 *
 * Generates usernames in format: user${random6to8digits}
 * Checks for case-insensitive collision before assignment.
 *
 * Run with: npx tsx prisma/migrations/scripts/assign-default-usernames.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Generate a random number between 6 and 8 digits
 */
function generateRandomDigits(): string {
  // Randomly choose between 6, 7, or 8 digits
  const digitCount = Math.floor(Math.random() * 3) + 6 // 6, 7, or 8
  const min = Math.pow(10, digitCount - 1)
  const max = Math.pow(10, digitCount) - 1
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

/**
 * Generate a candidate username
 */
function generateUsername(): string {
  return `user${generateRandomDigits()}`
}

/**
 * Check if a username is already taken (case-insensitive)
 */
async function isUsernameTaken(username: string): Promise<boolean> {
  const existingUser = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: 'insensitive'
      }
    }
  })
  return existingUser !== null
}

/**
 * Generate a unique username with collision checking
 */
async function generateUniqueUsername(): Promise<string> {
  let attempts = 0
  const maxAttempts = 100

  while (attempts < maxAttempts) {
    const candidate = generateUsername()
    const taken = await isUsernameTaken(candidate)

    if (!taken) {
      return candidate
    }

    attempts++
  }

  throw new Error(`Failed to generate unique username after ${maxAttempts} attempts`)
}

async function main() {
  console.log('Starting default username assignment...\n')

  // Find all users without a username
  const usersWithoutUsername = await prisma.user.findMany({
    where: {
      username: null
    },
    select: {
      id: true,
      email: true,
      name: true
    }
  })

  console.log(`Found ${usersWithoutUsername.length} users without username\n`)

  if (usersWithoutUsername.length === 0) {
    console.log('No users need username assignment. Done!')
    return
  }

  let successCount = 0
  let errorCount = 0

  for (const user of usersWithoutUsername) {
    try {
      const newUsername = await generateUniqueUsername()

      await prisma.user.update({
        where: { id: user.id },
        data: { username: newUsername }
      })

      console.log(`Assigned username "${newUsername}" to user ${user.email || user.id}`)
      successCount++
    } catch (error) {
      console.error(`Failed to assign username to user ${user.id}:`, error)
      errorCount++
    }
  }

  console.log(`\nCompleted: ${successCount} successful, ${errorCount} failed`)
}

main()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
