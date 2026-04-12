import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import BookEditForm from '@/components/admin/BookEditForm'
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import EditionCoverManager from '@/components/admin/EditionCoverManager'

async function getBook(id: string) {
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      editions: {
        include: {
          googleBook: true,
          hardcoverBook: true,
          ibdbBook: true,
          _count: {
            select: {
              userBooks: true
            }
          }
        }
      }
    }
  })

  if (!book) {
    notFound()
  }

  // Calculate total user count
  const userCount = book.editions.reduce(
    (acc, edition) => acc + edition._count.userBooks, 
    0
  )

  return {
    ...book,
    userCount
  }
}

export default async function BookEditPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  await requireAdmin()
  const { id } = await params
  const book = await getBook(id)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/admin" className="text-gray-500 hover:text-gray-700">
              Admin
            </Link>
          </li>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          <li>
            <Link href="/admin/books" className="text-gray-500 hover:text-gray-700">
              Books
            </Link>
          </li>
          <ChevronRightIcon className="h-4 w-4 text-gray-400" />
          <li className="text-gray-900">Edit Book</li>
        </ol>
      </nav>

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Edit Book</h2>
        <p className="mt-1 text-sm text-gray-600">
          Update book information and metadata
        </p>
      </div>

      {/* Edit Form */}
      <BookEditForm book={book} />

      {/* Editions Section */}
      {book.editions && book.editions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Editions</h3>
          <div className="space-y-4">
            {book.editions.map((edition) => (
              <div key={edition.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">ISBN-13:</span>
                    <p className="text-sm text-gray-900">{edition.isbn13 || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">ISBN-10:</span>
                    <p className="text-sm text-gray-900">{edition.isbn10 || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Format:</span>
                    <p className="text-sm text-gray-900">{edition.format || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Users:</span>
                    <p className="text-sm text-gray-900">{edition._count.userBooks}</p>
                  </div>
                </div>
                
                <EditionCoverManager
                  editionId={edition.id}
                  defaultCoverProvider={edition.defaultCoverProvider}
                  customCoverUrl={edition.customCoverUrl}
                  googleBookImageUrl={edition.googleBook?.imageUrl ?? null}
                  hardcoverBookImageUrl={edition.hardcoverBook?.imageUrl ?? null}
                  ibdbBookImageUrl={edition.ibdbBook?.imageUrl ?? null}
                />

                {edition.googleBook && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Google Books Data</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Published:</span>
                        <span className="ml-2 text-gray-900">{edition.googleBook.publishedDate || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Pages:</span>
                        <span className="ml-2 text-gray-900">{edition.googleBook.pageCount || 'N/A'}</span>
                      </div>
                      {edition.googleBook.categories && edition.googleBook.categories.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Categories:</span>
                          <span className="ml-2 text-gray-900">{edition.googleBook.categories.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}