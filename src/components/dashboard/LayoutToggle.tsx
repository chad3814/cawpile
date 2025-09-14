"use client"

import GridIcon from "@/components/icons/GridIcon"
import TableIcon from "@/components/icons/TableIcon"

interface LayoutToggleProps {
  currentLayout: 'GRID' | 'TABLE'
  onLayoutChange: (layout: 'GRID' | 'TABLE') => void
}

export default function LayoutToggle({ currentLayout, onLayoutChange }: LayoutToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1" role="group" aria-label="View options">
      <button
        onClick={() => onLayoutChange('GRID')}
        className={`p-2 rounded-md transition-colors ${
          currentLayout === 'GRID'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        }`}
        aria-label="Grid view"
        aria-pressed={currentLayout === 'GRID'}
      >
        <GridIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => onLayoutChange('TABLE')}
        className={`p-2 rounded-md transition-colors ${
          currentLayout === 'TABLE'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
        }`}
        aria-label="Table view"
        aria-pressed={currentLayout === 'TABLE'}
      >
        <TableIcon className="w-5 h-5" />
      </button>
    </div>
  )
}