import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create or update admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'chad@chad-cat-lore-eddie.com' },
    update: {
      name: 'Chad Walker',
      isAdmin: true,
      isSuperAdmin: true,
    },
    create: {
      email: 'chad@chad-cat-lore-eddie.com',
      name: 'Chad Walker',
      isAdmin: true,
      isSuperAdmin: true,
    },
  })

  console.log('✅ Created/updated admin user:', {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    isAdmin: adminUser.isAdmin,
    isSuperAdmin: adminUser.isSuperAdmin,
  })

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