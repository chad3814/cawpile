'use client'

import Image from 'next/image'
import { ProfileUserData } from '@/types/profile'

interface ProfileHeaderProps {
  user: ProfileUserData
}

/**
 * Profile header displaying user info: name, username, bio, and profile picture
 */
export default function ProfileHeader({ user }: ProfileHeaderProps) {
  // Use profilePictureUrl with fallback to OAuth image
  const imageUrl = user.profilePictureUrl || user.image

  // Generate initials for fallback avatar
  const initials = user.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.username.slice(0, 2).toUpperCase()

  return (
    <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {imageUrl ? (
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-md">
                <Image
                  src={imageUrl}
                  alt={user.name || user.username}
                  fill
                  className="object-cover"
                  sizes="128px"
                  priority
                />
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 flex items-center justify-center shadow-md">
                <span className="text-2xl sm:text-3xl font-bold text-primary">
                  {initials}
                </span>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">
              {user.name || user.username}
            </h1>
            <p className="text-muted-foreground mt-1">
              @{user.username}
            </p>

            {user.bio && (
              <p className="mt-4 text-card-foreground max-w-2xl">
                {user.bio}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
