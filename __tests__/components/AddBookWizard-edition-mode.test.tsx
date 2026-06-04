import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import AddBookWizard from '@/components/modals/AddBookWizard'

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

describe('AddBookWizard edition mode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('submits editionId (not signedResult) when in edition mode', async () => {
    const fetchMock = jest.fn((url: string, _init?: RequestInit) => {
      if (url === '/api/user/books') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ userBook: {} }) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })
    global.fetch = fetchMock as unknown as typeof fetch

    const onComplete = jest.fn()
    await act(async () => {
      render(
        <AddBookWizard
          isOpen
          onClose={jest.fn()}
          book={null}
          editionId="ed-123"
          editionDisplay={{ title: 'Edition Title', authors: ['Author One'], imageUrl: null }}
          onComplete={onComplete}
        />
      )
    })

    // Defaults to WANT_TO_READ; the wizard has 2 steps — advance to final step first.
    // Step 1 requires a format selection before Next is enabled.
    expect(screen.getByText('Edition Title')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: /hardcover/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    // Now on step 2 (final step for WANT_TO_READ), click "Add Book".
    fireEvent.click(screen.getByRole('button', { name: /add book/i }))

    await waitFor(() => expect(onComplete).toHaveBeenCalled())

    const postCall = fetchMock.mock.calls.find(([url]) => url === '/api/user/books')
    expect(postCall).toBeDefined()
    const body = JSON.parse((postCall![1]!.body) as string)
    expect(body.editionId).toBe('ed-123')
    expect(body.signedResult).toBeUndefined()
  })

  it('surfaces the API error message on failure', async () => {
    const fetchMock = jest.fn((url: string) => {
      if (url === '/api/user/books') {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Book already in library' }) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })
    global.fetch = fetchMock as unknown as typeof fetch

    await act(async () => {
      render(
        <AddBookWizard
          isOpen
          onClose={jest.fn()}
          book={null}
          editionId="ed-123"
          editionDisplay={{ title: 'Edition Title', authors: ['Author One'], imageUrl: null }}
          onComplete={jest.fn()}
        />
      )
    })

    // Step 1: select a format to enable Next, then advance to step 2.
    fireEvent.click(screen.getByRole('checkbox', { name: /hardcover/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    // Step 2 is the final step for WANT_TO_READ — submit.
    fireEvent.click(screen.getByRole('button', { name: /add book/i }))

    await waitFor(() => expect(screen.getByText('Book already in library')).toBeInTheDocument())
  })
})
