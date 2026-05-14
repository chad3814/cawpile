import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LibrarySectionClient from '@/components/dashboard/LibrarySectionClient'
import type { DashboardBookData } from '@/types/dashboard'

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => <img alt={alt} {...props} />,
}))

// Mock @dnd-kit to avoid complex DOM requirements in tests
jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  closestCenter: jest.fn(),
  KeyboardSensor: jest.fn(),
  PointerSensor: jest.fn(),
  useSensor: jest.fn(),
  useSensors: jest.fn(() => []),
}))

jest.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  sortableKeyboardCoordinates: jest.fn(),
  rectSortingStrategy: jest.fn(),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

jest.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => null } },
}))

const makeBook = (id: string, title: string, isPinned = false): DashboardBookData => ({
  id,
  status: 'WANT_TO_READ',
  format: [],
  progress: 0,
  startDate: null,
  finishDate: null,
  createdAt: new Date(),
  isPinned,
  edition: {
    id: `edition-${id}`,
    title,
    book: {
      id: `book-${id}`,
      title,
      authors: ['Test Author'],
    },
    googleBook: null,
    hardcoverBook: null,
    ibdbBook: null,
  },
  cawpileRating: null,
})

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) })
  ) as jest.Mock
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('LibrarySectionClient', () => {
  test('renders title and book count', () => {
    const books = [makeBook('1', 'Book One'), makeBook('2', 'Book Two')]
    render(<LibrarySectionClient books={books} title="To Be Read" />)

    expect(screen.getByText('To Be Read')).toBeInTheDocument()
    expect(screen.getByText('2 books')).toBeInTheDocument()
  })

  test('renders singular "book" for single item', () => {
    const books = [makeBook('1', 'Solo Book')]
    render(<LibrarySectionClient books={books} title="Currently Reading" />)

    expect(screen.getByText('1 book')).toBeInTheDocument()
  })

  test('shows empty state when no books', () => {
    render(<LibrarySectionClient books={[]} title="To Be Read" />)

    expect(screen.getByText('No books in this section yet.')).toBeInTheDocument()
  })

  test('renders back link to dashboard', () => {
    render(<LibrarySectionClient books={[]} title="TBR" />)

    const backLink = screen.getByRole('link', { name: /back to dashboard/i })
    expect(backLink).toHaveAttribute('href', '/dashboard')
  })

  test('renders book cards for each book', () => {
    const books = [makeBook('1', 'First Book'), makeBook('2', 'Second Book')]
    render(<LibrarySectionClient books={books} title="TBR" />)

    expect(screen.getByText('First Book')).toBeInTheDocument()
    expect(screen.getByText('Second Book')).toBeInTheDocument()
  })

  test('pin toggle calls the API', async () => {
    const books = [makeBook('1', 'Pin Test Book')]
    render(<LibrarySectionClient books={books} title="TBR" />)

    const pinButton = screen.getByTitle('Pin to top')
    fireEvent.click(pinButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/books/1/pin',
        expect.objectContaining({ method: 'PATCH' })
      )
    })
  })

  test('shows drag reorder hint text', () => {
    const books = [makeBook('1', 'A Book')]
    render(<LibrarySectionClient books={books} title="TBR" />)

    expect(screen.getByText(/drag to reorder/i)).toBeInTheDocument()
  })
})
