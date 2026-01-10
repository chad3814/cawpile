'use client'

import Image from 'next/image'
import { BookType, getFacetConfig, convertToStars, getStarEmojis } from '@/types/cawpile'
import {
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
  BG_COLOR,
  TEXT_COLOR,
  TEXT_MUTED_COLOR,
  ACCENT_COLOR,
  BORDER_COLOR,
  TYPOGRAPHY,
  SPACING,
  COVER_SIZE,
  MAX_REVIEW_CHARS,
  getScoreColor,
} from '@/lib/image/imageTheme'
import { truncateReviewText } from '@/lib/image/generateReviewImage'

interface ReviewImageTemplateProps {
  book: {
    title: string
    authors: string[]
    coverUrl: string | null
    bookType: BookType
  }
  rating: {
    average: number
    characters: number | null
    atmosphere: number | null
    writing: number | null
    plot: number | null
    intrigue: number | null
    logic: number | null
    enjoyment: number | null
  }
  review: string | null
  privacySettings: {
    showDates: boolean
    showBookClubs: boolean
    showReadathons: boolean
  }
  metadata?: {
    startDate: Date | null
    finishDate: Date | null
    bookClubName: string | null
    readathonName: string | null
  }
}

/**
 * Template component for generating shareable review images.
 * Uses inline styles exclusively for html2canvas compatibility.
 * Dimensions: 1080x1920 (9:16 aspect ratio for Instagram Stories/TikTok)
 */
export default function ReviewImageTemplate({
  book,
  rating,
  review,
  privacySettings,
  metadata,
}: ReviewImageTemplateProps) {
  const facets = getFacetConfig(book.bookType)
  const stars = convertToStars(rating.average)
  const starEmojis = getStarEmojis(stars)
  const truncatedReview = truncateReviewText(review, MAX_REVIEW_CHARS)

  const formatDate = (date: Date | null): string | null => {
    if (!date) return null
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Check if we should show any metadata
  const showMetadata =
    (privacySettings.showDates && metadata && (metadata.startDate || metadata.finishDate)) ||
    (privacySettings.showBookClubs && metadata?.bookClubName) ||
    (privacySettings.showReadathons && metadata?.readathonName)

  return (
    <div
      style={{
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
        backgroundColor: BG_COLOR,
        color: TEXT_COLOR,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        padding: SPACING.padding,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Book Cover & Title Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: SPACING.sectionGap,
        }}
      >
        {/* Book Cover */}
        <div
          style={{
            width: COVER_SIZE.width,
            height: COVER_SIZE.height,
            borderRadius: 12,
            overflow: 'hidden',
            marginBottom: SPACING.itemGap,
            backgroundColor: '#1e293b', // slate-800 for placeholder
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              width={COVER_SIZE.width}
              height={COVER_SIZE.height}
              style={{
                objectFit: 'cover',
                width: COVER_SIZE.width,
                height: COVER_SIZE.height,
              }}
              unoptimized
            />
          ) : (
            <div
              style={{
                color: TEXT_MUTED_COLOR,
                fontSize: 14,
                textAlign: 'center',
                padding: 20,
              }}
            >
              No Cover Available
            </div>
          )}
        </div>

        {/* Book Title */}
        <h1
          style={{
            fontSize: TYPOGRAPHY.title.fontSize,
            fontWeight: TYPOGRAPHY.title.fontWeight,
            lineHeight: TYPOGRAPHY.title.lineHeight,
            textAlign: 'center',
            margin: 0,
            marginBottom: SPACING.smallGap,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {book.title}
        </h1>

        {/* Author */}
        <p
          style={{
            fontSize: TYPOGRAPHY.author.fontSize,
            fontWeight: TYPOGRAPHY.author.fontWeight,
            lineHeight: TYPOGRAPHY.author.lineHeight,
            color: TEXT_MUTED_COLOR,
            textAlign: 'center',
            margin: 0,
          }}
        >
          {book.authors.join(', ')}
        </p>
      </div>

      {/* Overall Rating Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: SPACING.sectionGap,
          padding: SPACING.itemGap,
          backgroundColor: '#1e293b',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            fontSize: TYPOGRAPHY.average.fontSize,
            fontWeight: TYPOGRAPHY.average.fontWeight,
            lineHeight: TYPOGRAPHY.average.lineHeight,
            color: ACCENT_COLOR,
          }}
        >
          {rating.average.toFixed(1)}/10
        </div>
        <div
          style={{
            fontSize: TYPOGRAPHY.stars.fontSize,
            lineHeight: TYPOGRAPHY.stars.lineHeight,
            marginTop: SPACING.smallGap,
          }}
        >
          {starEmojis || 'Not rated'}
        </div>
      </div>

      {/* CAWPILE Facets Section */}
      <div
        style={{
          marginBottom: SPACING.sectionGap,
        }}
      >
        <h2
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: TEXT_COLOR,
            margin: 0,
            marginBottom: SPACING.itemGap,
          }}
        >
          CAWPILE Rating
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: SPACING.smallGap,
          }}
        >
          {facets.map((facet) => {
            const value = rating[facet.key as keyof typeof rating]
            const displayValue = typeof value === 'number' ? value : '--'
            const scoreColor = typeof value === 'number' ? getScoreColor(value) : TEXT_MUTED_COLOR

            return (
              <div
                key={facet.key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: `${SPACING.smallGap}px ${SPACING.itemGap}px`,
                  backgroundColor: '#1e293b',
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    fontSize: TYPOGRAPHY.facetName.fontSize,
                    fontWeight: TYPOGRAPHY.facetName.fontWeight,
                    color: TEXT_COLOR,
                  }}
                >
                  {facet.name.split('/')[0]}
                </span>
                <span
                  style={{
                    fontSize: TYPOGRAPHY.facetScore.fontSize,
                    fontWeight: TYPOGRAPHY.facetScore.fontWeight,
                    color: scoreColor,
                  }}
                >
                  {displayValue}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Review Text Section */}
      {truncatedReview && (
        <div
          style={{
            marginBottom: SPACING.sectionGap,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <h2
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: TEXT_COLOR,
              margin: 0,
              marginBottom: SPACING.smallGap,
            }}
          >
            Review
          </h2>
          <p
            style={{
              fontSize: TYPOGRAPHY.review.fontSize,
              fontWeight: TYPOGRAPHY.review.fontWeight,
              lineHeight: TYPOGRAPHY.review.lineHeight,
              color: TEXT_MUTED_COLOR,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {truncatedReview}
          </p>
        </div>
      )}

      {/* Metadata Section (Conditional) */}
      {showMetadata && (
        <div
          style={{
            marginBottom: SPACING.sectionGap,
            padding: SPACING.itemGap,
            borderTop: `1px solid ${BORDER_COLOR}`,
            paddingTop: SPACING.itemGap,
          }}
        >
          {privacySettings.showDates && metadata && (metadata.startDate || metadata.finishDate) && (
            <div
              style={{
                fontSize: TYPOGRAPHY.metadata.fontSize,
                color: TEXT_MUTED_COLOR,
                marginBottom: SPACING.smallGap,
              }}
            >
              <span style={{ marginRight: 8 }}>📅</span>
              {metadata.startDate && metadata.finishDate
                ? `${formatDate(metadata.startDate)} - ${formatDate(metadata.finishDate)}`
                : metadata.startDate
                ? `Started ${formatDate(metadata.startDate)}`
                : `Finished ${formatDate(metadata.finishDate)}`}
            </div>
          )}

          {privacySettings.showBookClubs && metadata?.bookClubName && (
            <div
              style={{
                fontSize: TYPOGRAPHY.metadata.fontSize,
                color: TEXT_MUTED_COLOR,
                marginBottom: SPACING.smallGap,
              }}
            >
              <span style={{ marginRight: 8 }}>👥</span>
              {metadata.bookClubName}
            </div>
          )}

          {privacySettings.showReadathons && metadata?.readathonName && (
            <div
              style={{
                fontSize: TYPOGRAPHY.metadata.fontSize,
                color: TEXT_MUTED_COLOR,
              }}
            >
              <span style={{ marginRight: 8 }}>⚡</span>
              {metadata.readathonName}
            </div>
          )}
        </div>
      )}

      {/* Cawpile Branding Footer */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: SPACING.itemGap,
          borderTop: `1px solid ${BORDER_COLOR}`,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: TYPOGRAPHY.branding.fontSize,
            fontWeight: TYPOGRAPHY.branding.fontWeight,
            color: ACCENT_COLOR,
          }}
        >
          Powered by Cawpile
        </span>
      </div>
    </div>
  )
}
