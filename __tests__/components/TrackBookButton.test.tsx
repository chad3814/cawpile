import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import TrackBookButton from '@/components/book/TrackBookButton'

const pushMock = jest.fn()
const replaceMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock, refresh: jest.fn() }),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

// Stub the wizard so we only assert open/closed state.
jest.mock('@/components/modals/AddBookWizard', () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="wizard-open" /> : null),
}))

import { useSession } from 'next-auth/react'
const mockUseSession = useSession as jest.Mock

const props = {
  bookId: 'book-1',
  editionId: 'ed-1',
  title: 'A Book',
  authors: ['An Author'],
  imageUrl: null,
}

describe('TrackBookButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState(null, '', '/b/book-1')
  })

  it('redirects logged-out users to sign-in with a return URL', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    render(<TrackBookButton {...props} />)
    fireEvent.click(screen.getByRole('button', { name: /track book/i }))
    expect(pushMock).toHaveBeenCalledWith(
      `/auth/signin?callbackUrl=${encodeURIComponent('/b/book-1?track=1')}`
    )
    expect(screen.queryByTestId('wizard-open')).not.toBeInTheDocument()
  })

  it('opens the wizard for logged-in users', () => {
    mockUseSession.mockReturnValue({ data: { user: { id: 'u1' } }, status: 'authenticated' })
    render(<TrackBookButton {...props} />)
    fireEvent.click(screen.getByRole('button', { name: /track book/i }))
    expect(screen.getByTestId('wizard-open')).toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('auto-opens the wizard when authenticated and ?track=1 is present', () => {
    window.history.replaceState(null, '', '/b/book-1?track=1')
    mockUseSession.mockReturnValue({ data: { user: { id: 'u1' } }, status: 'authenticated' })
    render(<TrackBookButton {...props} />)
    expect(screen.getByTestId('wizard-open')).toBeInTheDocument()
    expect(window.location.search).not.toContain('track')
  })

  it('does nothing while the session is loading', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' })
    render(<TrackBookButton {...props} />)
    fireEvent.click(screen.getByRole('button', { name: /track book/i }))
    expect(pushMock).not.toHaveBeenCalled()
    expect(screen.queryByTestId('wizard-open')).not.toBeInTheDocument()
  })
})
