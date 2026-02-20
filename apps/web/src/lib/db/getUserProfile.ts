import prisma from '@/lib/prisma'
import { ProfileUserData } from '@/types/profile'

/**
 * Fetch a user by username with case-insensitive lookup
 * Returns null for non-existent users to trigger 404
 */
export async function getUserByUsername(username: string): Promise<ProfileUserData | null> {
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      profilePictureUrl: true,
      image: true,
      showCurrentlyReading: true,
      profileEnabled: true,
      showTbr: true
    }
  })

  if (!user || !user.username) {
    return null
  }

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    bio: user.bio,
    profilePictureUrl: user.profilePictureUrl,
    image: user.image,
    showCurrentlyReading: user.showCurrentlyReading,
    profileEnabled: user.profileEnabled,
    showTbr: user.showTbr
  }
}
