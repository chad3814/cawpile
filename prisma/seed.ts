import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // NOTE: Users should be created through OAuth providers (Google, etc.)
  // To make a user an admin, sign in first, then run:
  // npm run make-admin

  // You can add other seed data here if needed
  // For example, sample books, categories, etc.

  console.log('🌱 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })