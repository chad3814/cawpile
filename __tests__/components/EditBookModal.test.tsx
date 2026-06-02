/**
 * Tests for EditBookModal start/finish/DNF date editing
 */
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import EditBookModal from '@/components/modals/EditBookModal'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
) as jest.Mock

const getBody = (mockFetch: jest.Mock) => {
  const patchCall = mockFetch.mock.calls.find((call: [string, RequestInit]) =>
    call[0].includes('/api/user/books/')
  )
  return patchCall ? JSON.parse(patchCall[1].body as string) : null
}

describe('EditBookModal date editing', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-03-20'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const renderModal = async (book: React.ComponentProps<typeof EditBookModal>['book']) => {
    await act(async () => {
      render(<EditBookModal isOpen={true} onClose={mockOnClose} book={book} />)
    })
  }

  test('start enabled and finish disabled for Reading status', async () => {
    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'READING',
      format: ['PAPERBACK'],
      startDate: new Date('2024-03-01'),
    })

    const start = document.querySelector('#start-date') as HTMLInputElement
    const finish = document.querySelector('#finish-date') as HTMLInputElement
    expect(start).not.toBeDisabled()
    expect(start).toHaveValue('2024-03-01')
    expect(finish).toBeDisabled()
    expect(screen.getByText('Finished')).toBeInTheDocument()
  })

  test('both dates disabled for Want to Read status', async () => {
    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'WANT_TO_READ',
      format: ['PAPERBACK'],
    })

    expect(document.querySelector('#start-date')).toBeDisabled()
    expect(document.querySelector('#finish-date')).toBeDisabled()
  })

  test('finish field labeled "Finished" and enabled for Completed status', async () => {
    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'COMPLETED',
      format: ['PAPERBACK'],
      startDate: new Date('2024-02-01'),
      finishDate: new Date('2024-03-01'),
    })

    const finish = document.querySelector('#finish-date') as HTMLInputElement
    expect(finish).not.toBeDisabled()
    expect(finish).toHaveValue('2024-03-01')
    expect(screen.getByText('Finished')).toBeInTheDocument()
  })

  test('finish field labeled "Stopped reading" for DNF status', async () => {
    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'DNF',
      format: ['PAPERBACK'],
      finishDate: new Date('2024-02-15'),
      dnfReason: 'Too slow',
    })

    expect(screen.getByText('Stopped reading')).toBeInTheDocument()
    const finish = document.querySelector('#finish-date') as HTMLInputElement
    expect(finish).toHaveValue('2024-02-15')
  })

  test('editing start and finish on a Completed book sends both dates', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userBook: { id: 'b1' } }),
    })
    global.fetch = mockFetch

    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'COMPLETED',
      format: ['PAPERBACK'],
      startDate: new Date('2024-02-01'),
      finishDate: new Date('2024-03-01'),
    })

    await act(async () => {
      fireEvent.change(document.querySelector('#start-date') as HTMLInputElement, {
        target: { value: '2024-02-05' },
      })
      fireEvent.change(document.querySelector('#finish-date') as HTMLInputElement, {
        target: { value: '2024-03-10' },
      })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const body = getBody(mockFetch)
    expect(body.startDate).toBe('2024-02-05')
    expect(body.finishDate).toBe('2024-03-10')
  })

  test('shows an error and does not submit when finish is before start', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userBook: { id: 'b1' } }),
    })
    global.fetch = mockFetch

    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'COMPLETED',
      format: ['PAPERBACK'],
      startDate: new Date('2024-03-01'),
      finishDate: new Date('2024-03-01'),
    })

    await act(async () => {
      fireEvent.change(document.querySelector('#finish-date') as HTMLInputElement, {
        target: { value: '2024-02-01' },
      })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))
    })

    expect(screen.getByText('Finish date cannot be before the start date')).toBeInTheDocument()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  test('switching Completed to Reading sends finishDate null', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userBook: { id: 'b1' } }),
    })
    global.fetch = mockFetch

    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'COMPLETED',
      format: ['PAPERBACK'],
      startDate: new Date('2024-02-01'),
      finishDate: new Date('2024-03-01'),
    })

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Reading Status'), {
        target: { value: 'READING' },
      })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const body = getBody(mockFetch)
    expect(body.finishDate).toBeNull()
    expect(body.startDate).toBe('2024-02-01')
  })

  test('clearing the start date on a Reading book does not re-fill it', async () => {
    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'READING',
      format: ['PAPERBACK'],
      startDate: new Date('2024-03-01'),
    })

    const start = document.querySelector('#start-date') as HTMLInputElement
    await act(async () => {
      fireEvent.change(start, { target: { value: '' } })
    })

    expect(start).toHaveValue('')
  })

  test('switching to DNF defaults the finish date to today', async () => {
    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'READING',
      format: ['PAPERBACK'],
      startDate: new Date('2024-03-01'),
    })

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Reading Status'), {
        target: { value: 'DNF' },
      })
    })

    const finish = document.querySelector('#finish-date') as HTMLInputElement
    expect(finish).toHaveValue('2024-03-20')
  })

  test('switching to Want to Read sends both dates null', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ userBook: { id: 'b1' } }),
    })
    global.fetch = mockFetch

    await renderModal({
      id: 'b1',
      title: 'Test',
      status: 'COMPLETED',
      format: ['PAPERBACK'],
      startDate: new Date('2024-02-01'),
      finishDate: new Date('2024-03-01'),
    })

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Reading Status'), {
        target: { value: 'WANT_TO_READ' },
      })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const body = getBody(mockFetch)
    expect(body.startDate).toBeNull()
    expect(body.finishDate).toBeNull()
  })
})
