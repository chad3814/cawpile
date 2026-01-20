"use client"

import { useState } from 'react'
import LayoutToggle from './LayoutToggle'
import SortDropdown from './SortDropdown'
import ViewSwitcher from './ViewSwitcher'
import TabNavigation from './TabNavigation'
import { ChartsTab } from '@/components/charts/ChartsTab'
import { ChartDataProvider } from '@/contexts/ChartDataContext'
import { LibrarySortBy, LibrarySortOrder } from '@prisma/client'
import type { DashboardBookData } from '@/types/dashboard'

interface DashboardClientProps {
  books: DashboardBookData[]
  initialLayout: 'GRID' | 'TABLE'
  initialSortBy: LibrarySortBy
  initialSortOrder: LibrarySortOrder
  userName?: string
}

export default function DashboardClient({ books, initialLayout, initialSortBy, initialSortOrder, userName }: DashboardClientProps) {
  const [layout, setLayout] = useState<'GRID' | 'TABLE'>(initialLayout)
  const [sortBy, setSortBy] = useState<LibrarySortBy>(initialSortBy)
  const [sortOrder, setSortOrder] = useState<LibrarySortOrder>(initialSortOrder)
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

  const handleSortChange = async (newSortBy: LibrarySortBy, newSortOrder: LibrarySortOrder) => {
    // Optimistic update
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)

    // Save to database
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ librarySortBy: newSortBy, librarySortOrder: newSortOrder }),
      })

      if (response.ok) {
        // Reload the page to refetch sorted data from server
        window.location.reload()
      } else {
        console.error('Failed to save sort preference')
      }
    } catch (error) {
      console.error('Error saving sort preference:', error)
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
              <div className="flex items-center gap-2">
                <SortDropdown
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  onSortChange={handleSortChange}
                />
                <LayoutToggle
                  currentLayout={layout}
                  onLayoutChange={handleLayoutChange}
                />
              </div>
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