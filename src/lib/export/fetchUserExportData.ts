/**
 * Fetches all user data for export.
 */

import prisma from '@/lib/prisma'
import type { RawUserExportData } from './exportUtils'

/**
 * Fetches all user data needed for export.
 * Includes profile, userBooks with nested relationships, bookClubs, and readathons.
 */
export async function fetchUserExportData(userId: string): Promise<RawUserExportData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      // Profile fields
      name: true,
      username: true,
      bio: true,
      readingGoal: true,
      dashboardLayout: true,
      librarySortBy: true,
      librarySortOrder: true,
      profileEnabled: true,
      showCurrentlyReading: true,
      showTbr: true,
      // Related data
      userBooks: {
        select: {
          id: true,
          status: true,
          format: true,
          startDate: true,
          finishDate: true,
          progress: true,
          currentPage: true,
          review: true,
          notes: true,
          isFavorite: true,
          acquisitionMethod: true,
          acquisitionOther: true,
          bookClubName: true,
          readathonName: true,
          isReread: true,
          dnfReason: true,
          lgbtqRepresentation: true,
          lgbtqDetails: true,
          disabilityRepresentation: true,
          disabilityDetails: true,
          isNewAuthor: true,
          authorPoc: true,
          authorPocDetails: true,
          preferredCoverProvider: true,
          createdAt: true,
          updatedAt: true,
          edition: {
            select: {
              id: true,
              isbn10: true,
              isbn13: true,
              book: {
                select: {
                  title: true,
                  authors: true,
                },
              },
            },
          },
          cawpileRating: {
            select: {
              characters: true,
              atmosphere: true,
              writing: true,
              plot: true,
              intrigue: true,
              logic: true,
              enjoyment: true,
              average: true,
            },
          },
          readingSessions: {
            select: {
              id: true,
              startPage: true,
              endPage: true,
              pagesRead: true,
              duration: true,
              notes: true,
              sessionDate: true,
            },
          },
          sharedReview: {
            select: {
              shareToken: true,
              showDates: true,
              showBookClubs: true,
              showReadathons: true,
              showReview: true,
            },
          },
        },
      },
      bookClubs: {
        select: {
          name: true,
          usageCount: true,
          lastUsed: true,
        },
      },
      readathons: {
        select: {
          name: true,
          usageCount: true,
          lastUsed: true,
        },
      },
    },
  })

  if (!user) {
    return null
  }

  return {
    profile: {
      name: user.name,
      username: user.username,
      bio: user.bio,
      readingGoal: user.readingGoal,
      dashboardLayout: user.dashboardLayout,
      librarySortBy: user.librarySortBy,
      librarySortOrder: user.librarySortOrder,
      profileEnabled: user.profileEnabled,
      showCurrentlyReading: user.showCurrentlyReading,
      showTbr: user.showTbr,
    },
    userBooks: user.userBooks,
    bookClubs: user.bookClubs,
    readathons: user.readathons,
  }
}
