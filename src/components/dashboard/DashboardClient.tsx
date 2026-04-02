"use client"

import { useState } from 'react'
import ViewSwitcher from './ViewSwitcher'
import TabNavigation from './TabNavigation'
import { ChartsTab } from '@/components/charts/ChartsTab'
import { ChartDataProvider } from '@/contexts/ChartDataContext'
import type { DashboardBookData } from '@/types/dashboard'

interface DashboardClientProps {
  books: DashboardBookData[]
}

export default function DashboardClient({ books }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'books' | 'charts'>('books')

  return (
    <ChartDataProvider>
      <>
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'books' ? (
          <ViewSwitcher books={books} layout="GRID" />
        ) : (
          <ChartsTab />
        )}
      </>
    </ChartDataProvider>
  )
}