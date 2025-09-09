import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function getCurrentUser() {
  const session = await auth()
  
  if (!session?.user?.email) {
    return null
  }
  
  try {
    // Get or create user in database
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!user) {
      // Create user if doesn't exist
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
          emailVerified: new Date(),
        }
      })
    }
    
    return {
      ...session.user,
      id: user.id,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}