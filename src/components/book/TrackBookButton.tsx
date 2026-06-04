'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AddBookWizard from '@/components/modals/AddBookWizard'

interface TrackBookButtonProps {
  bookId: string
  editionId: string
  title: string
  authors: string[]
  imageUrl?: string | null
}

export default function TrackBookButton({
  bookId,
  editionId,
  title,
  authors,
  imageUrl,
}: TrackBookButtonProps) {
  const { status } = useSession()
  const router = useRouter()
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [added, setAdded] = useState(false)

  // After returning from sign-in (?track=1), open the wizard and strip the param.
  useEffect(() => {
    if (status !== 'authenticated') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('track') === '1') {
      setIsWizardOpen(true)
      params.delete('track')
      const qs = params.toString()
      window.history.replaceState(null, '', `/b/${bookId}${qs ? `?${qs}` : ''}`)
    }
  }, [status, bookId])

  const handleClick = () => {
    if (status === 'loading') return
    if (status === 'authenticated') {
      setIsWizardOpen(true)
      return
    }
    const callbackUrl = `/b/${bookId}?track=1`
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={added || status === 'loading'}
        className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-default disabled:opacity-70 focus-ring"
      >
        {added ? 'Added to your library' : 'Track book'}
      </button>

      {added && (
        <span role="status" className="sr-only">
          Added to your library
        </span>
      )}

      <AddBookWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        book={null}
        editionId={editionId}
        editionDisplay={{ title, authors, imageUrl }}
        onComplete={() => {
          setAdded(true)
          setIsWizardOpen(false)
        }}
      />
    </>
  )
}
