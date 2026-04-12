'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { StarIcon, TrashIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface ProviderCover {
  provider: 'google' | 'hardcover' | 'ibdb' | 'custom'
  label: string
  imageUrl: string | null
}

interface EditionCoverManagerProps {
  editionId: string
  defaultCoverProvider: string | null
  customCoverUrl: string | null
  googleBookImageUrl: string | null
  hardcoverBookImageUrl: string | null
  ibdbBookImageUrl: string | null
}

const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function EditionCoverManager({
  editionId,
  defaultCoverProvider,
  customCoverUrl,
  googleBookImageUrl,
  hardcoverBookImageUrl,
  ibdbBookImageUrl,
}: EditionCoverManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const covers: ProviderCover[] = [
    { provider: 'custom', label: 'Custom', imageUrl: customCoverUrl },
    { provider: 'hardcover', label: 'Hardcover', imageUrl: hardcoverBookImageUrl },
    { provider: 'google', label: 'Google', imageUrl: googleBookImageUrl },
    { provider: 'ibdb', label: 'IBDB', imageUrl: ibdbBookImageUrl },
  ]

  const activeCovers = covers.filter((c) => c.imageUrl)

  async function handleSetDefault(provider: string) {
    setLoading(true)
    try {
      const newProvider = defaultCoverProvider === provider ? null : provider
      const res = await fetch(`/api/admin/editions/${editionId}/covers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_default', provider: newProvider }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to set default cover')
        return
      }
      router.refresh()
    } catch {
      alert('Failed to set default cover')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteCover(provider: string, label: string) {
    if (!window.confirm(`Delete the ${label} cover image? This cannot be undone.`)) {
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/editions/${editionId}/covers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_cover', provider }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Failed to delete cover')
        return
      }
      router.refresh()
    } catch {
      alert('Failed to delete cover')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(file: File) {
    setUploadError(null)

    if (!VALID_TYPES.includes(file.type)) {
      setUploadError('Invalid file type. Use JPEG, PNG, or WebP.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Maximum size is 5MB.')
      return
    }

    setUploading(true)
    try {
      // 1. Get presigned URL
      const presignedRes = await fetch(`/api/admin/editions/${editionId}/covers/presigned-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
      })

      if (!presignedRes.ok) {
        const data = await presignedRes.json()
        setUploadError(data.error || 'Failed to get upload URL')
        return
      }

      const { presignedUrl, key } = await presignedRes.json()

      // 2. Upload to S3
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadRes.ok) {
        setUploadError('Failed to upload file to storage')
        return
      }

      // 3. Process the upload (resize + save to edition)
      const processRes = await fetch(`/api/admin/editions/${editionId}/covers/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })

      if (!processRes.ok) {
        const data = await processRes.json()
        setUploadError(data.error || 'Failed to process cover image')
        return
      }

      router.refresh()
    } catch {
      setUploadError('Failed to upload cover image')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Cover Images</h4>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="h-3.5 w-3.5" />
            {uploading ? 'Uploading...' : 'Upload Cover'}
          </button>
        </div>
      </div>

      {uploadError && (
        <p className="text-xs text-red-600 mb-3">{uploadError}</p>
      )}

      {activeCovers.length === 0 ? (
        <p className="text-sm text-gray-500">No cover images available. Upload one to get started.</p>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {activeCovers.map((cover) => {
            const isDefault = defaultCoverProvider === cover.provider
            return (
              <div key={cover.provider} className="relative flex flex-col items-center">
                <div className="relative w-24 h-36 bg-gray-100 rounded overflow-hidden">
                  <Image
                    src={cover.imageUrl!}
                    alt={`${cover.label} cover`}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-xs text-gray-600">{cover.label}</span>
                  {isDefault && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full font-medium">
                      Default
                    </span>
                  )}
                </div>
                <div className="mt-1 flex gap-1">
                  <button
                    onClick={() => handleSetDefault(cover.provider)}
                    disabled={loading || uploading}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                    title={isDefault ? 'Clear default' : 'Set as default'}
                  >
                    {isDefault ? (
                      <StarIconSolid className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <StarIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteCover(cover.provider, cover.label)}
                    disabled={loading || uploading}
                    className="p-1 rounded hover:bg-red-50 disabled:opacity-50"
                    title="Delete cover"
                  >
                    <TrashIcon className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
