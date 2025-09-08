import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing admin user setup...')

  // First, delete the improperly created user if it exists
  const existingUser = await prisma.user.findUnique({
    where: { email: 'chad@chad-cat-lore-eddie.com' },
    include: { accounts: true }
  })

  if (existingUser && existingUser.accounts.length === 0) {
    // User exists but has no OAuth accounts linked - this is the problem
    console.log('❌ Found user without OAuth account, removing...')
    await prisma.user.delete({
      where: { id: existingUser.id }
    })
    console.log('✅ Removed conflicting user')
  } else if (existingUser && existingUser.accounts.length > 0) {
    // User exists with OAuth - just update to admin
    console.log('✅ User exists with OAuth account')
    if (!existingUser.isAdmin || !existingUser.isSuperAdmin) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          isAdmin: true,
          isSuperAdmin: true
        }
      })
      console.log('✅ Updated user to admin/super-admin')
    } else {
      console.log('✅ User is already admin/super-admin')
    }
  } else {
    console.log('ℹ️  User does not exist yet. Please sign in with Google first, then run this script again.')
  }

  console.log('🔧 Fix complete!')
}

main()
  .catch((e) => {
    console.error('❌ Fix failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })