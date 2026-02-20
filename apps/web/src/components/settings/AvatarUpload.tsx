'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

interface AvatarUploadProps {
  profilePictureUrl: string | null
  fallbackImage: string | null
  name: string | null
  onUpdate: (profilePictureUrl: string | null) => void
  onError: (message: string) => void
}

export default function AvatarUpload({
  profilePictureUrl,
  fallbackImage,
  name,
  onUpdate,
  onError,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentImage = profilePictureUrl || fallbackImage
  const displayImage = preview || currentImage
  const hasCustomAvatar = !!profilePictureUrl

  const validateFile = (file: File): string | null => {
    if (!VALID_TYPES.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB'
    }
    return null
  }

  const uploadFile = async (file: File) => {
    const error = validateFile(file)
    if (error) {
      onError(error)
      return
    }

    // Show preview
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    setIsUploading(true)

    try {
      // Get presigned URL
      const presignedResponse = await fetch('/api/user/avatar/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type,
          fileSize: file.size,
        }),
      })

      if (!presignedResponse.ok) {
        const data = await presignedResponse.json()
        throw new Error(data.error || 'Failed to get upload URL')
      }

      const { presignedUrl, key } = await presignedResponse.json()

      // Upload to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }

      // Complete the upload (trigger resize and update profile)
      const completeResponse = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })

      if (!completeResponse.ok) {
        const data = await completeResponse.json()
        throw new Error(data.error || 'Failed to process image')
      }

      const { profilePictureUrl: newUrl } = await completeResponse.json()
      onUpdate(newUrl)
      setPreview(null)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to upload image')
      setPreview(null)
    } finally {
      setIsUploading(false)
      URL.revokeObjectURL(previewUrl)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const file = e.dataTransfer.files?.[0]
      if (file) {
        uploadFile(file)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleRemove = async () => {
    if (!hasCustomAvatar) return

    setIsRemoving(true)

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove avatar')
      }

      onUpdate(null)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to remove avatar')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="flex items-start space-x-6">
      {/* Avatar Display */}
      <div className="relative">
        <div
          className={`w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ${
            isUploading ? 'opacity-50' : ''
          }`}
        >
          {displayImage ? (
            <Image
              src={displayImage}
              alt={name || 'Profile picture'}
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl font-medium text-gray-500 dark:text-gray-400">
                {name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-orange-500" />
          </div>
        )}
      </div>

      {/* Upload Controls */}
      <div className="flex-1">
        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragActive
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="font-medium text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300 focus:outline-none"
            >
              Upload a file
            </button>
            {' '}or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            PNG, JPG, GIF or WebP up to 5MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={VALID_TYPES.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Action Buttons */}
        {hasCustomAvatar && (
          <div className="mt-3 flex space-x-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isRemoving}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading || isRemoving}
              className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
            >
              {isRemoving ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-red-500 mr-1" />
                  Removing...
                </>
              ) : (
                <>
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Remove
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
