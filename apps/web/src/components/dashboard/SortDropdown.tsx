"use client"

import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'
import type { LibrarySortBy, LibrarySortOrder } from '@prisma/client'

interface SortOption {
  value: LibrarySortBy
  label: string
  defaultOrder: LibrarySortOrder
}

const sortOptions: SortOption[] = [
  { value: 'END_DATE', label: 'End Date', defaultOrder: 'DESC' },
  { value: 'START_DATE', label: 'Start Date', defaultOrder: 'DESC' },
  { value: 'TITLE', label: 'Title', defaultOrder: 'ASC' },
  { value: 'DATE_ADDED', label: 'Date Added', defaultOrder: 'DESC' },
]

interface SortDropdownProps {
  currentSortBy: LibrarySortBy
  currentSortOrder: LibrarySortOrder
  onSortChange: (sortBy: LibrarySortBy, sortOrder: LibrarySortOrder) => void
}

export default function SortDropdown({
  currentSortBy,
  currentSortOrder,
  onSortChange
}: SortDropdownProps) {
  const currentOption = sortOptions.find(opt => opt.value === currentSortBy) || sortOptions[0]

  const handleSelect = (option: SortOption) => {
    if (option.value === currentSortBy) {
      // Toggle sort order if same option selected
      const newOrder = currentSortOrder === 'ASC' ? 'DESC' : 'ASC'
      onSortChange(option.value, newOrder)
    } else {
      // Use default order for new option
      onSortChange(option.value, option.defaultOrder)
    }
  }

  return (
    <Listbox value={currentOption} onChange={handleSelect}>
      <div className="relative">
        <Listbox.Button className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm text-foreground hover:bg-muted/80 transition-colors focus-ring">
          <span>{currentOption.label}</span>
          {currentSortOrder === 'ASC' ? (
            <ArrowUpIcon className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ArrowDownIcon className="w-4 h-4 text-muted-foreground" />
          )}
          <ChevronUpDownIcon className="w-4 h-4 text-muted-foreground" />
        </Listbox.Button>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute right-0 mt-1 w-40 overflow-hidden rounded-lg bg-card border border-border shadow-lg focus:outline-none z-10">
            {sortOptions.map((option) => (
              <Listbox.Option
                key={option.value}
                value={option}
                className={({ active }) =>
                  `cursor-pointer select-none px-3 py-2 text-sm ${
                    active ? 'bg-muted' : ''
                  } ${option.value === currentSortBy ? 'text-primary font-medium' : 'text-card-foreground'}`
                }
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {option.value === currentSortBy && (
                    currentSortOrder === 'ASC' ? (
                      <ArrowUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3" />
                    )
                  )}
                </div>
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  )
}
