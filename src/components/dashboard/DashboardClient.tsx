"use client"

import { useState, useCallback } from 'react'
import SidebarNavigation from './SidebarNavigation'
import type { DashboardSection } from './SidebarNavigation'
import BookGrid from './BookGrid'
import { ChartsTab } from '@/components/charts/ChartsTab'
import { ChartDataProvider } from '@/contexts/ChartDataContext'
import type { DashboardBookData } from '@/types/dashboard'

interface DashboardClientProps {
  books: DashboardBookData[]
}

export default function DashboardClient({ books }: DashboardClientProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>('library')

  const handleSectionChange = useCallback((section: DashboardSection, anchor?: string) => {
    setActiveSection(section)
    if (anchor) {
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }, [])

  return (
    <ChartDataProvider>
      <div className="flex gap-8 items-start">
        <SidebarNavigation activeSection={activeSection} onSectionChange={handleSectionChange} />

        <div className="flex-1 min-w-0">
          {activeSection === 'books' && (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-lg font-medium text-foreground">Books</p>
              <p className="mt-2 text-sm">Site-wide book info — coming soon.</p>
            </div>
          )}
          {activeSection === 'authors' && (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-lg font-medium text-foreground">Authors</p>
              <p className="mt-2 text-sm">Site-wide author info — coming soon.</p>
            </div>
          )}
          {activeSection === 'library' && (
            <BookGrid books={books} />
          )}
          {activeSection === 'recaps' && (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-lg font-medium text-foreground">Recaps</p>
              <p className="mt-2 text-sm">Monthly recaps — coming soon.</p>
            </div>
          )}
          {activeSection === 'charts' && (
            <ChartsTab />
          )}
        </div>
      </div>
    </ChartDataProvider>
  )
}
