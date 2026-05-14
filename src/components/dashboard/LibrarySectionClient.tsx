"use client"

import { useState, useCallback, useRef } from 'react'
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

function comparePinnedThenOrder(a: DashboardBookData, b: DashboardBookData): number {
  if (a.isPinned && !b.isPinned) return -1
  if (!a.isPinned && b.isPinned) return 1
  const aOrder = a.sortOrder ?? Number.POSITIVE_INFINITY
  const bOrder = b.sortOrder ?? Number.POSITIVE_INFINITY
  return aOrder - bOrder
}

async function persistOrder(bookIds: string[], signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch('/api/user/books/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookIds }),
      signal,
    })
    return res.ok
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // A newer reorder request superseded this one; treat as success.
      return true
    }
    return false
  }
}

export default function LibrarySectionClient({ books: initialBooks, title }: LibrarySectionClientProps) {
  const [books, setBooks] = useState(initialBooks)
  const reorderController = useRef<AbortController | null>(null)

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
    if (oldIndex === -1 || newIndex === -1) return

    const previous = books
    const reordered = arrayMove(books, oldIndex, newIndex).map((b, idx) => ({
      ...b,
      sortOrder: idx,
    }))
    setBooks(reordered)

    // Cancel any in-flight reorder so concurrent drags don't race on the server.
    reorderController.current?.abort()
    const controller = new AbortController()
    reorderController.current = controller

    const ok = await persistOrder(reordered.map(b => b.id), controller.signal)
    if (!ok) {
      setBooks(previous)
    }
  }, [books])

  const handleTogglePin = useCallback(async (bookId: string) => {
    const previous = books
    const updated = books
      .map(b => (b.id === bookId ? { ...b, isPinned: !b.isPinned } : b))
      .slice()
      .sort(comparePinnedThenOrder)
      .map((b, idx) => ({ ...b, sortOrder: idx }))
    setBooks(updated)

    const pinRes = await fetch(`/api/user/books/${bookId}/pin`, { method: 'PATCH' })
    if (!pinRes.ok) {
      setBooks(previous)
      return
    }

    // Persist new order so the server matches the client view (handles sortOrder=null jump).
    const orderOk = await persistOrder(updated.map(b => b.id))
    if (!orderOk) {
      setBooks(previous)
    }
  }, [books])

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

      {books.length > 0 && (
        <div className="mt-4 text-xs text-muted-foreground">
          Drag to reorder. Click the pin icon to pin books to the top.
        </div>
      )}
    </div>
  )
}
