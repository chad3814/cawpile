import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import PublicReviewDisplay from '@/components/share/PublicReviewDisplay'

interface PageProps {
  params: Promise<{
    shareToken: string
  }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareToken } = await params

  const sharedReview = await prisma.sharedReview.findUnique({
    where: { shareToken },
    include: {
      userBook: {
        include: {
          edition: {
            include: {
              book: true
            }
          }
        }
      }
    }
  })

  if (!sharedReview) {
    return {
      title: 'Review Not Found | Cawpile',
      robots: 'noindex, nofollow'
    }
  }

  const bookTitle = sharedReview.userBook.edition.title || sharedReview.userBook.edition.book.title
  const reviewText = sharedReview.userBook.review

  return {
    title: `${bookTitle} - Review | Cawpile`,
    description: reviewText
      ? reviewText.substring(0, 160)
      : `CAWPILE rating for ${bookTitle}`,
    robots: 'noindex, nofollow'
  }
}

export default async function PublicReviewPage({ params }: PageProps) {
  const { shareToken } = await params

  const sharedReview = await prisma.sharedReview.findUnique({
    where: { shareToken },
    include: {
      userBook: {
        include: {
          edition: {
            include: {
              googleBook: true,
              book: true
            }
          },
          cawpileRating: true
        }
      }
    }
  })

  if (!sharedReview) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <PublicReviewDisplay sharedReview={sharedReview} />
    </div>
  )
}
