'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { BookWithEditions } from '@/types/book'
import { detectBookType } from '@/lib/bookTypeDetection'

interface BookEditFormProps {
  book: BookWithEditions
  onSave?: () => void
}

export default function BookEditForm({ book, onSave }: BookEditFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Form fields
  const [title, setTitle] = useState(book.title)
  const [authors, setAuthors] = useState<string[]>(book.authors || [])
  const [bookType, setBookType] = useState<'FICTION' | 'NONFICTION'>(book.bookType)
  const [language, setLanguage] = useState(book.language)
  
  // Get categories from GoogleBook data if available
  const categories = book.editions?.flatMap(edition => 
    edition.googleBook?.categories || []
  ).filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
  
  const suggestedBookType = categories && categories.length > 0 
    ? detectBookType(categories) 
    : null
  
  const [showSuggestion, setShowSuggestion] = useState(
    suggestedBookType && suggestedBookType !== book.bookType
  )
  
  // Track changes
  useEffect(() => {
    const changed = 
      title !== book.title ||
      JSON.stringify(authors) !== JSON.stringify(book.authors) ||
      bookType !== book.bookType ||
      language !== book.language
    
    setHasChanges(changed)
  }, [title, authors, bookType, language, book])

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  const handleAddAuthor = () => {
    setAuthors([...authors, ''])
  }

  const handleRemoveAuthor = (index: number) => {
    setAuthors(authors.filter((_, i) => i !== index))
  }

  const handleAuthorChange = (index: number, value: string) => {
    const newAuthors = [...authors]
    newAuthors[index] = value
    setAuthors(newAuthors)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch(`/api/admin/books/${book.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          authors: authors.filter(a => a.trim()),
          bookType,
          language,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setHasChanges(false)
        if (onSave) onSave()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
        
        // Refresh the page data
        router.refresh()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save changes')
      }
    } catch {
      setError('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">Changes saved successfully!</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          />
        </div>

        {/* Authors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Authors
          </label>
          <div className="space-y-2">
            {authors.map((author, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={author}
                  onChange={(e) => handleAuthorChange(index, e.target.value)}
                  placeholder="Author name"
                  className="flex-1 rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
                <button
                  onClick={() => handleRemoveAuthor(index)}
                  className="p-2 text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleAddAuthor}
            className="mt-2 inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Author
          </button>
        </div>

        {/* Book Type */}
        <div>
          <label htmlFor="bookType" className="block text-sm font-medium text-gray-700">
            Book Type
          </label>
          
          {showSuggestion && suggestedBookType && (
            <div className="mt-1 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-2 flex-1">
                  <p className="text-sm text-blue-700">
                    Based on categories ({categories?.slice(0, 3).join(', ')}{categories && categories.length > 3 ? '...' : ''}), 
                    this book should be <strong>{suggestedBookType === 'FICTION' ? 'Fiction' : 'Non-Fiction'}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBookType(suggestedBookType)
                      setShowSuggestion(false)
                    }}
                    className="mt-1 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Apply suggestion
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuggestion(false)}
                  className="ml-2 text-blue-400 hover:text-blue-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          <select
            id="bookType"
            value={bookType}
            onChange={(e) => {
              setBookType(e.target.value as 'FICTION' | 'NONFICTION')
              setShowSuggestion(false)
            }}
            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          >
            <option value="FICTION">Fiction</option>
            <option value="NONFICTION">Non-Fiction</option>
          </select>
          
          {categories && categories.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Categories: {categories.join(', ')}
            </p>
          )}
        </div>

        {/* Language */}
        <div>
          <label htmlFor="language" className="block text-sm font-medium text-gray-700">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="nl">Dutch</option>
            <option value="ru">Russian</option>
            <option value="ja">Japanese</option>
            <option value="zh">Chinese</option>
          </select>
        </div>

        {/* Non-editable fields */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Read-Only Information</h3>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Book ID:</span>
              <span className="ml-2 text-sm text-gray-900">{book.id}</span>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">Total Users:</span>
              <span className="ml-2 text-sm text-gray-900">{book.userCount || 0}</span>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">Editions:</span>
              <span className="ml-2 text-sm text-gray-900">{book.editions?.length || 0}</span>
            </div>

            {book.editions && book.editions.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">ISBNs:</span>
                <ul className="mt-1 text-sm text-gray-900">
                  {book.editions.map((edition) => (
                    <li key={edition.id} className="ml-2">
                      {edition.isbn13 || edition.isbn10 || 'No ISBN'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={() => router.push('/admin/books')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Back to List
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}