'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'

interface BulkActionBarProps {
  selectedCount: number
  onChangeType: () => void
  onClearSelection: () => void
}

export default function BulkActionBar({
  selectedCount,
  onChangeType,
  onClearSelection
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-orange-800">
          {selectedCount} book{selectedCount !== 1 ? 's' : ''} selected
        </span>
        {selectedCount >= 100 && (
          <span className="text-sm text-orange-600">
            (Maximum selection limit reached)
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={onChangeType}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Change Type
        </button>
        <button
          onClick={onClearSelection}
          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <XMarkIcon className="h-4 w-4 mr-1" />
          Clear Selection
        </button>
      </div>
    </div>
  )
}