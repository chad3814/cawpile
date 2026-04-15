"use client"

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import SortableBookCard from './SortableBookCard'
import type { DashboardBookData } from '@/types/dashboard'

interface LibrarySectionClientProps {
  books: DashboardBookData[]
  title: string
}

export default function LibrarySectionClient({ books: initialBooks, title }: LibrarySectionClientProps) {
  const [books, setBooks] = useState(initialBooks)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = books.findIndex(b => b.id === active.id)
    const newIndex = books.findIndex(b => b.id === over.id)

    const reordered = arrayMove(books, oldIndex, newIndex)
    setBooks(reordered)

    // Persist to server
    await fetch('/api/user/books/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookIds: reordered.map(b => b.id) }),
    })
  }, [books])

  const handleTogglePin = useCallback(async (bookId: string) => {
    // Optimistic update
    setBooks(prev => {
      const updated = prev.map(b =>
        b.id === bookId ? { ...b, isPinned: !b.isPinned } : b
      )
      // Re-sort: pinned first, then by current order
      return updated.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return 0
      })
    })

    await fetch(`/api/user/books/${bookId}/pin`, {
      method: 'PATCH',
    })
  }, [])

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard"
          className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="sr-only">Back to dashboard</span>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <span className="text-sm text-muted-foreground">
          {books.length} {books.length === 1 ? 'book' : 'books'}
        </span>
      </div>

      {books.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No books in this section yet.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={books.map(b => b.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {books.map(book => (
                <SortableBookCard
                  key={book.id}
                  book={book}
                  isPinned={book.isPinned ?? false}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        Drag to reorder. Click the pin icon to pin books to the top.
      </div>
    </div>
  )
}
