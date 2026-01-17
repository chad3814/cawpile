import prisma from '@/lib/prisma'
import { ProfileSharedReview } from '@/types/profile'

/**
 * Fetch all shared reviews for a user's public profile
 * Ordered by most recently created first
 */
export async function getProfileSharedReviews(userId: string): Promise<ProfileSharedReview[]> {
  const sharedReviews = await prisma.sharedReview.findMany({
    where: {
      userId: userId
    },
    include: {
      userBook: {
        include: {
          edition: {
            include: {
              book: true,
              googleBook: {
                select: {
                  imageUrl: true
                }
              }
            }
          },
          cawpileRating: {
            select: {
              id: true,
              average: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return sharedReviews.map((review) => ({
    id: review.id,
    shareToken: review.shareToken,
    showDates: review.showDates,
    showBookClubs: review.showBookClubs,
    showReadathons: review.showReadathons,
    showReview: review.showReview,
    createdAt: review.createdAt,
    userBook: {
      id: review.userBook.id,
      startDate: review.userBook.startDate,
      finishDate: review.userBook.finishDate,
      bookClubName: review.userBook.bookClubName,
      readathonName: review.userBook.readathonName,
      review: review.userBook.review,
      edition: {
        id: review.userBook.edition.id,
        title: review.userBook.edition.title,
        book: {
          title: review.userBook.edition.book.title,
          authors: review.userBook.edition.book.authors,
          bookType: review.userBook.edition.book.bookType
        },
        googleBook: review.userBook.edition.googleBook ? {
          imageUrl: review.userBook.edition.googleBook.imageUrl
        } : null
      },
      cawpileRating: review.userBook.cawpileRating
    }
  }))
}
