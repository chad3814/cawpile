"use client"

import { useState, useCallback, useEffect } from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import SidebarNavigation, { NAV_ITEMS } from './SidebarNavigation'
import type { DashboardSection } from './SidebarNavigation'
import BookGrid from './BookGrid'
import { ChartsTab } from '@/components/charts/ChartsTab'
import { RecapTab } from '@/components/recap/RecapTab'
import { ChartDataProvider } from '@/contexts/ChartDataContext'
import type { DashboardBookData } from '@/types/dashboard'

interface DashboardClientProps {
  books: DashboardBookData[]
}

export default function DashboardClient({ books }: DashboardClientProps) {
  const [activeSection, setActiveSection] = useState<DashboardSection>('library')
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)
  const [pendingAnchor, setPendingAnchor] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (pendingAnchor) {
      document.getElementById(pendingAnchor)?.scrollIntoView({ behavior: 'smooth' })
      setPendingAnchor(null)
    }
  }, [pendingAnchor])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setSidebarOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [])

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  const handleSectionChange = useCallback((section: DashboardSection, anchor?: string) => {
    setActiveSection(section)
    setSidebarOpen(false)
    if (anchor) {
      setActiveAnchor(anchor)
      setPendingAnchor(anchor)
    } else {
      setActiveAnchor(null)
    }
  }, [])

  return (
    <ChartDataProvider>
      <div className="flex gap-8 items-start">
        <SidebarNavigation
          activeSection={activeSection}
          activeAnchor={activeAnchor}
          onSectionChange={handleSectionChange}
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />

        <div className="flex-1 min-w-0">
          {/* Mobile menu toggle */}
          <div className="flex items-center gap-3 mb-4 md:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-expanded={sidebarOpen}
              aria-controls="mobile-sidebar"
              className="rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <span className="sr-only">Open navigation</span>
              <Bars3Icon className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {NAV_ITEMS.find(item => item.id === activeSection)?.label ?? activeSection}
            </span>
          </div>

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
            <RecapTab />
          )}
          {activeSection === 'charts' && (
            <ChartsTab />
          )}
        </div>
      </div>
    </ChartDataProvider>
  )
}
