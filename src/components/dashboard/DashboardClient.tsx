"use client"

import { useState } from 'react'
import LayoutToggle from './LayoutToggle'
import ViewSwitcher from './ViewSwitcher'

interface DashboardClientProps {
  books: any[]
  initialLayout: 'GRID' | 'TABLE'
  userName?: string
}

export default function DashboardClient({ books, initialLayout, userName }: DashboardClientProps) {
  const [layout, setLayout] = useState<'GRID' | 'TABLE'>(initialLayout)

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
          <LayoutToggle
            currentLayout={layout}
            onLayoutChange={handleLayoutChange}
          />
        </div>
      </div>

      {/* Book View */}
      <ViewSwitcher books={books} layout={layout} />
    </>
  )
}