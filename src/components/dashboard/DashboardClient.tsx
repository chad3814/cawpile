"use client"

import { useState } from 'react'
import LayoutToggle from './LayoutToggle'
import ViewSwitcher from './ViewSwitcher'
import TabNavigation from './TabNavigation'
import { ChartsTab } from '@/components/charts/ChartsTab'
import { ChartDataProvider } from '@/contexts/ChartDataContext'
import { BookStatus, BookFormat } from '@prisma/client'

interface BookData {
  id: string
  status: BookStatus
  format: BookFormat[]
  progress: number
  startDate: Date | null
  finishDate: Date | null
  createdAt: Date
  edition: {
    id: string
    title: string | null
    book: {
      title: string
      authors: string[]
      bookType?: 'FICTION' | 'NONFICTION'
    }
    googleBook: {
      imageUrl: string | null
      description: string | null
      pageCount: number | null
    } | null
  }
  cawpileRating?: {
    id: string
    average: number
    characters: number | null
    atmosphere: number | null
    writing: number | null
    plot: number | null
    intrigue: number | null
    logic: number | null
    enjoyment: number | null
  } | null
}

interface DashboardClientProps {
  books: BookData[]
  initialLayout: 'GRID' | 'TABLE'
  userName?: string
}

export default function DashboardClient({ books, initialLayout, userName }: DashboardClientProps) {
  const [layout, setLayout] = useState<'GRID' | 'TABLE'>(initialLayout)
  const [activeTab, setActiveTab] = useState<'books' | 'charts'>('books')

  const handleLayoutChange = async (newLayout: 'GRID' | 'TABLE') => {
    // Optimistic update
    setLayout(newLayout)

    // Save to database (will implement in Phase 5)
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dashboardLayout: newLayout }),
      })

      if (!response.ok) {
        console.error('Failed to save layout preference')
        // Show toast notification (will implement later)
      }
    } catch (error) {
      console.error('Error saving layout preference:', error)
      // Show toast notification (will implement later)
    }
  }

  return (
    <ChartDataProvider>
      <>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Welcome back, {userName || "Reader"}!
              </h1>
              <p className="text-muted-foreground mt-2">
                Your reading dashboard
              </p>
            </div>
            {activeTab === 'books' && (
              <LayoutToggle
                currentLayout={layout}
                onLayoutChange={handleLayoutChange}
              />
            )}
          </div>
        </div>

        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'books' ? (
          <ViewSwitcher books={books} layout={layout} />
        ) : (
          <ChartsTab />
        )}
      </>
    </ChartDataProvider>
  )
}