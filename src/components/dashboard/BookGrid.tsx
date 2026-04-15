"use client"

import Link from 'next/link'
import BookCard from './BookCard'
import EmptyLibrary from './EmptyLibrary'
import HeroScrollRow from '@/components/HeroScrollRow'
import type { DashboardBookData } from '@/types/dashboard'

interface BookGridProps {
  books: DashboardBookData[]
}

interface SectionConfig {
  id: string
  href: string
  title: string
  emptyText: string
  books: DashboardBookData[]
}

export default function BookGrid({ books }: BookGridProps) {
  if (books.length === 0) {
    return <EmptyLibrary />
  }

  const sections: SectionConfig[] = [
    {
      id: 'currently-reading',
      href: '/dashboard/currently-reading',
      title: 'Currently Reading',
      emptyText: 'No books currently being read.',
      books: books.filter(book => book.status === 'READING'),
    },
    {
      id: 'tbr',
      href: '/dashboard/tbr',
      title: 'To Be Read',
      emptyText: 'No books in your TBR list.',
      books: books.filter(book => book.status === 'WANT_TO_READ'),
    },
    {
      id: 'completed',
      href: '/dashboard/completed',
      title: 'Completed',
      emptyText: 'No completed books yet.',
      books: books.filter(book => book.status === 'COMPLETED' || book.status === 'DNF'),
    },
  ]

  return (
    <div>
      {sections.map(section => (
        <div key={section.id} id={section.id} className="mb-8 scroll-mt-8">
          {section.books.length > 0 ? (
            <HeroScrollRow
              title={section.title}
              titleHref={section.href}
            >
              {section.books.map((book) => (
                <div key={book.id} className="shrink-0 w-40">
                  <BookCard book={book} />
                </div>
              ))}
            </HeroScrollRow>
          ) : (
            <div>
              <Link
                href={section.href}
                className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
              >
                {section.title}
              </Link>
              <p className="text-sm text-muted-foreground mt-1">{section.emptyText}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
