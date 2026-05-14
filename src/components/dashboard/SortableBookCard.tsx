"use client"

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MapPinIcon as MapPinSolidIcon } from '@heroicons/react/24/solid'
import { MapPinIcon as MapPinOutlineIcon } from '@heroicons/react/24/outline'
import BookCard from './BookCard'
import type { DashboardBookData } from '@/types/dashboard'

interface SortableBookCardProps {
  book: DashboardBookData
  isPinned: boolean
  onTogglePin: (bookId: string) => void
}

export default function SortableBookCard({ book, isPinned, onTogglePin }: SortableBookCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: book.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag handle + pin overlay — always visible on touch, hover/focus-revealed on desktop */}
      <div className="absolute top-1 right-1 z-10 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onTogglePin(book.id)
          }}
          className={`rounded-full p-1 transition-colors ${
            isPinned
              ? 'bg-primary text-primary-foreground'
              : 'bg-background/80 text-muted-foreground hover:text-foreground'
          }`}
          title={isPinned ? 'Unpin' : 'Pin to top'}
        >
          {isPinned ? (
            <MapPinSolidIcon className="h-4 w-4" />
          ) : (
            <MapPinOutlineIcon className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing rounded p-1 bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
          title="Drag to reorder"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" />
            <circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" />
            <circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" />
            <circle cx="11" cy="13" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Pin indicator when controls are hidden on desktop */}
      {isPinned && (
        <div className="absolute top-1 right-1 z-10 hidden md:block md:group-hover:hidden md:group-focus-within:hidden">
          <div className="rounded-full p-1 bg-primary text-primary-foreground">
            <MapPinSolidIcon className="h-4 w-4" />
          </div>
        </div>
      )}

      <BookCard book={book} />
    </div>
  )
}
