import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Setting up admin users...')

  // Get admin emails from environment variable
  const adminEmailsEnv = process.env.ADMIN_EMAILS

  if (!adminEmailsEnv) {
    console.log('⚠️  No ADMIN_EMAILS environment variable found.')
    console.log('   Add ADMIN_EMAILS=email1@example.com,email2@example.com to your .env.local file')
    return
  }

  // Parse comma-separated emails and trim whitespace
  const adminEmails = adminEmailsEnv
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0)

  if (adminEmails.length === 0) {
    console.log('⚠️  ADMIN_EMAILS is empty. Please add email addresses.')
    return
  }

  console.log(`📧 Processing ${adminEmails.length} admin email(s):`)

  for (const email of adminEmails) {
    console.log(`\n🔍 Processing: ${email}`)

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true }
    })

    if (existingUser && existingUser.accounts.length === 0) {
      // User exists but has no OAuth accounts linked - this is the problem
      console.log('  ❌ Found user without OAuth account, removing...')
      await prisma.user.delete({
        where: { id: existingUser.id }
      })
      console.log('  ✅ Removed conflicting user')
      console.log('  ℹ️  Please sign in with Google using this email, then run this script again.')
    } else if (existingUser && existingUser.accounts.length > 0) {
      // User exists with OAuth - just update to admin
      console.log('  ✅ User exists with OAuth account')
      if (!existingUser.isAdmin || !existingUser.isSuperAdmin) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            isAdmin: true,
            isSuperAdmin: true
          }
        })
        console.log('  ✅ Updated user to admin/super-admin')
      } else {
        console.log('  ✅ User is already admin/super-admin')
      }
    } else {
      console.log('  ℹ️  User does not exist yet. Please sign in with Google first, then run this script again.')
    }
  }

  console.log('\n🔧 Admin setup complete!')
}

main()
  .catch((e) => {
    console.error('❌ Fix failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })