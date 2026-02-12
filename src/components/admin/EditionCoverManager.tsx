'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { StarIcon, TrashIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface ProviderCover {
  provider: 'google' | 'hardcover' | 'ibdb'
  label: string
  imageUrl: string | null
}

interface EditionCoverManagerProps {
  editionId: string
  defaultCoverProvider: string | null
  googleBookImageUrl: string | null
  hardcoverBookImageUrl: string | null
  ibdbBookImageUrl: string | null
}

export default function EditionCoverManager({
  editionId,
  defaultCoverProvider,
  googleBookImageUrl,
  hardcoverBookImageUrl,
  ibdbBookImageUrl,
}: EditionCoverManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const covers: ProviderCover[] = [
    { provider: 'hardcover', label: 'Hardcover', imageUrl: hardcoverBookImageUrl },
    { provider: 'google', label: 'Google', imageUrl: googleBookImageUrl },
    { provider: 'ibdb', label: 'IBDB', imageUrl: ibdbBookImageUrl },
  ]

  const activeCovers = covers.filter((c) => c.imageUrl)

  if (activeCovers.length === 0) {
    return null
  }

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

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Cover Images</h4>
      <div className="grid grid-cols-3 gap-4">
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
                  disabled={loading}
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
                  disabled={loading}
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
    </div>
  )
}
