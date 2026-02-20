'use client'

import { useState } from 'react'
import { useUsernameCheck } from '@/hooks/useUsernameCheck'
import AvatarUpload from './AvatarUpload'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface ProfileData {
  name: string | null
  username: string | null
  bio: string | null
  profilePictureUrl: string | null
  image: string | null
}

interface ProfileSectionProps {
  data: ProfileData
  onUpdate: (updates: Partial<ProfileData>) => void
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

export default function ProfileSection({
  data,
  onUpdate,
  onSuccess,
  onError,
}: ProfileSectionProps) {
  const [name, setName] = useState(data.name || '')
  const [username, setUsername] = useState(data.username || '')
  const [bio, setBio] = useState(data.bio || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isChecking, isAvailable, message: usernameMessage } = useUsernameCheck(
    username,
    data.username
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isChecking) {
      onError('Please wait for username check to complete')
      return
    }

    if (username && isAvailable === false) {
      onError('Please choose an available username')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || null,
          username: username || undefined,
          bio: bio || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      onUpdate({
        name: result.name,
        username: result.username,
        bio: result.bio,
      })
      onSuccess('Profile updated successfully')
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAvatarUpdate = (profilePictureUrl: string | null) => {
    onUpdate({ profilePictureUrl })
    onSuccess(profilePictureUrl ? 'Profile picture updated' : 'Profile picture removed')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
        Profile Information
      </h2>

      {/* Avatar Upload */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Profile Picture
        </label>
        <AvatarUpload
          profilePictureUrl={data.profilePictureUrl}
          fallbackImage={data.image}
          name={data.name}
          onUpdate={handleAvatarUpdate}
          onError={onError}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Display Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={255}
            placeholder="Your display name"
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Optional. {name.length}/255 characters
          </p>
        </div>

        {/* Username Field */}
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Username
          </label>
          <div className="relative">
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={128}
              placeholder="your_username"
              className={`block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-orange-500 sm:text-sm pr-10 ${
                username && isAvailable === false
                  ? 'border-red-500 focus:border-red-500'
                  : username && isAvailable === true
                  ? 'border-green-500 focus:border-green-500'
                  : 'focus:border-orange-500'
              }`}
            />
            {username && !isChecking && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {isAvailable === true ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : isAvailable === false ? (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                ) : null}
              </div>
            )}
            {isChecking && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />
              </div>
            )}
          </div>
          <p
            className={`mt-1 text-xs ${
              isAvailable === false
                ? 'text-red-500'
                : isAvailable === true
                ? 'text-green-500'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {usernameMessage ||
              'Letters, numbers, hyphens, and underscores only. ' + username.length + '/128 characters'}
          </p>
        </div>

        {/* Bio Field */}
        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Tell us about yourself..."
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Optional. {bio.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || isChecking || (username !== '' && isAvailable === false)}
            className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
