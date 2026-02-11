import React from 'react'
import { Composition } from 'remotion'
import { MonthlyRecap, calculateDuration } from './compositions/MonthlyRecap'
import { VIDEO_CONFIG } from './lib/theme'
import type { MonthlyRecapExport } from './lib/types'

// Sample data for preview in Remotion Studio
const sampleData: MonthlyRecapExport = {
  meta: {
    month: 1,
    year: 2025,
    monthName: 'January',
    generatedAt: new Date().toISOString(),
  },
  books: [
    {
      id: '1',
      title: 'The House in the Cerulean Sea',
      authors: ['TJ Klune'],
      coverUrl: 'https://covers.openlibrary.org/b/id/10392738-L.jpg',
      status: 'COMPLETED',
      finishDate: '2025-01-15T00:00:00.000Z',
      rating: {
        average: 8.7,
        characters: 9,
        atmosphere: 9,
        writing: 8,
        plot: 8,
        intrigue: 9,
        logic: 8,
        enjoyment: 10,
      },
      pageCount: 398,
    },
    {
      id: '2',
      title: 'Project Hail Mary',
      authors: ['Andy Weir'],
      coverUrl: 'https://covers.openlibrary.org/b/id/10540649-L.jpg',
      status: 'COMPLETED',
      finishDate: '2025-01-22T00:00:00.000Z',
      rating: {
        average: 9.2,
        characters: 9,
        atmosphere: 9,
        writing: 9,
        plot: 10,
        intrigue: 10,
        logic: 9,
        enjoyment: 9,
      },
      pageCount: 496,
    },
    {
      id: '3',
      title: 'A Court of Thorns and Roses',
      authors: ['Sarah J. Maas'],
      coverUrl: 'https://covers.openlibrary.org/b/id/8314135-L.jpg',
      status: 'DNF',
      finishDate: '2025-01-28T00:00:00.000Z',
      rating: {
        average: 4.5,
        characters: 5,
        atmosphere: 6,
        writing: 4,
        plot: 4,
        intrigue: 4,
        logic: 4,
        enjoyment: 4,
      },
      pageCount: 419,
    },
  ],
  currentlyReading: [
    {
      id: '4',
      title: 'The Name of the Wind',
      authors: ['Patrick Rothfuss'],
      coverUrl: 'https://covers.openlibrary.org/b/id/8760894-L.jpg',
      progress: 45,
    },
    {
      id: '5',
      title: 'Educated',
      authors: ['Tara Westover'],
      coverUrl: 'https://covers.openlibrary.org/b/id/8225261-L.jpg',
      progress: 72,
    },
  ],
  stats: {
    totalBooks: 3,
    completedCount: 2,
    dnfCount: 1,
    totalPages: 894,
    averageRating: 7.5,
    topRatedBook: {
      title: 'Project Hail Mary',
      coverUrl: 'https://covers.openlibrary.org/b/id/10540649-L.jpg',
      rating: 9.2,
    },
    lowestRatedBook: {
      title: 'A Court of Thorns and Roses',
      coverUrl: 'https://covers.openlibrary.org/b/id/8314135-L.jpg',
      rating: 4.5,
    },
  },
}

export const RemotionRoot: React.FC = () => {
  const duration = calculateDuration(sampleData)

  return (
    <>
      <Composition
        id="MonthlyRecap"
        component={MonthlyRecap}
        durationInFrames={duration}
        fps={VIDEO_CONFIG.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
        defaultProps={{
          data: sampleData,
        }}
      />
    </>
  )
}
