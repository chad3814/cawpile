'use client'

import { BookType, getFacetConfig, convertToStars, getStarEmojis } from '@/types/cawpile'
import {
  IMAGE_WIDTH,
  IMAGE_HEIGHT,
  BG_COLOR,
  TEXT_COLOR,
  TEXT_MUTED_COLOR,
  ACCENT_COLOR,
  BORDER_COLOR,
  SPACING,
  MAX_REVIEW_CHARS,
} from '@/lib/image/imageTheme'
import { truncateReviewText } from '@/lib/image/generateReviewImage'
import { stripHtmlToText } from '@/lib/utils/sanitize'

interface ReviewImageTemplateProps {
  book: {
    title: string
    authors: string[]
    coverUrl: string | null
    bookType: BookType
    description?: string | null
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
    showReview: boolean
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
 * Design matches PublicReviewDisplay layout.
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
      month: 'long',
      day: 'numeric',
    })
  }

  // Check if we should show any metadata
  const showMetadata =
    (privacySettings.showDates && metadata && (metadata.startDate || metadata.finishDate)) ||
    (privacySettings.showBookClubs && metadata?.bookClubName) ||
    (privacySettings.showReadathons && metadata?.readathonName)

  // Card background color (slate-800/900 mix for card feel)
  const CARD_BG = '#1e293b'
  const MUTED_BG = 'rgba(100, 116, 139, 0.2)' // muted background for rating box

  // Truncate description to fit within the available space
  // The description should be around 140px max height, which is roughly 5-6 lines at 16px font
  const MAX_DESCRIPTION_CHARS = 350
  // Strip HTML from description before truncation (image templates cannot render HTML)
  const cleanDescription = stripHtmlToText(book.description)
  const truncatedDescription = cleanDescription
    ? cleanDescription.length > MAX_DESCRIPTION_CHARS
      ? cleanDescription.substring(0, MAX_DESCRIPTION_CHARS).trim() + '...'
      : cleanDescription
    : null

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
      {/* Main Card Container */}
      <div
        style={{
          backgroundColor: CARD_BG,
          borderRadius: 16,
          border: `1px solid ${BORDER_COLOR}`,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Book Header - Side by Side Layout */}
        <div
          style={{
            padding: 32,
            display: 'flex',
            flexDirection: 'row',
            gap: 32,
          }}
        >
          {/* Book Cover */}
          <div
            style={{
              width: 240,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 240,
                height: 360,
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
              }}
            >
              {book.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  width={240}
                  height={360}
                  style={{
                    objectFit: 'cover',
                    width: 240,
                    height: 360,
                  }}
                  crossOrigin="anonymous"
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
          </div>

          {/* Book Info */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: 48,
                fontWeight: 700,
                lineHeight: 1.2,
                margin: 0,
                marginBottom: 12,
                color: TEXT_COLOR,
                textDecoration: 'none',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              {book.title}
            </h1>

            {/* Author */}
            <p
              style={{
                fontSize: 24,
                lineHeight: 1.4,
                color: TEXT_MUTED_COLOR,
                margin: 0,
                marginBottom: 24,
              }}
            >
              {book.authors.join(', ')}
            </p>

            {/* Overall Rating Box */}
            <div
              style={{
                backgroundColor: MUTED_BG,
                borderRadius: 12,
                padding: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <span
                style={{
                  fontSize: 36,
                  lineHeight: 1,
                }}
              >
                {starEmojis || '☆☆☆☆☆'}
              </span>
              <span
                style={{
                  fontSize: 20,
                  color: TEXT_MUTED_COLOR,
                }}
              >
                ({rating.average.toFixed(1)}/10)
              </span>
            </div>

            {/* Book Description */}
            {truncatedDescription && (
              <div
                style={{
                  marginTop: 16,
                  maxHeight: 140,
                  overflow: 'hidden',
                }}
              >
                <p
                  style={{
                    fontSize: 16,
                    lineHeight: 1.5,
                    color: TEXT_MUTED_COLOR,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {truncatedDescription}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CAWPILE Rating Section */}
        <div
          style={{
            padding: '0 32px 24px 32px',
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: TEXT_COLOR,
              margin: 0,
              marginBottom: 20,
            }}
          >
            CAWPILE Rating
          </h2>

          {/* Facets - Vertical List */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {facets.map((facet) => {
              const value = rating[facet.key as keyof typeof rating]
              const displayValue = typeof value === 'number' ? value : '--'
              const letter = facet.name.charAt(0).toUpperCase()

              return (
                <div
                  key={facet.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                  }}
                >
                  {/* Box with Letter + Word */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: MUTED_BG,
                      border: `1px solid ${BORDER_COLOR}`,
                      borderRadius: 12,
                      padding: '12px 20px',
                      minWidth: 120,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 40,
                        fontWeight: 700,
                        color: TEXT_COLOR,
                        lineHeight: 1,
                      }}
                    >
                      {letter}
                    </span>
                    <span
                      style={{
                        fontSize: 16,
                        color: TEXT_COLOR,
                        marginTop: 4,
                      }}
                    >
                      {facet.name.split('/')[0]}
                    </span>
                  </div>

                  {/* Rating Number with /10 suffix */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        color: TEXT_COLOR,
                      }}
                    >
                      {displayValue}
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        color: TEXT_MUTED_COLOR,
                      }}
                    >
                      /10
                    </span>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: 16,
                      color: TEXT_MUTED_COLOR,
                      margin: 0,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {facet.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Review Text Section */}
        {privacySettings.showReview && truncatedReview && (
          <div
            style={{
              padding: '0 32px 24px 32px',
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <h2
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: TEXT_COLOR,
                margin: 0,
                marginBottom: 16,
              }}
            >
              Review
            </h2>
            <p
              style={{
                fontSize: 20,
                lineHeight: 1.6,
                color: TEXT_COLOR,
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {truncatedReview}
            </p>
          </div>
        )}

        {/* Metadata Section (Reading Details) */}
        {showMetadata && (
          <div
            style={{
              padding: '24px 32px',
              borderTop: `1px solid ${BORDER_COLOR}`,
            }}
          >
            <h2
              style={{
                fontSize: 28,
                fontWeight: 600,
                color: TEXT_COLOR,
                margin: 0,
                marginBottom: 16,
              }}
            >
              Reading Details
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {privacySettings.showDates && metadata && (metadata.startDate || metadata.finishDate) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 18,
                  }}
                >
                  <span style={{ fontSize: 24 }}>📅</span>
                  <div>
                    <span style={{ color: TEXT_MUTED_COLOR }}>Reading period: </span>
                    <span style={{ color: TEXT_COLOR }}>
                      {metadata.startDate && metadata.finishDate
                        ? `${formatDate(metadata.startDate)} - ${formatDate(metadata.finishDate)}`
                        : metadata.startDate
                        ? `Started ${formatDate(metadata.startDate)}`
                        : `Finished ${formatDate(metadata.finishDate)}`}
                    </span>
                  </div>
                </div>
              )}

              {privacySettings.showBookClubs && metadata?.bookClubName && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 18,
                  }}
                >
                  <span style={{ fontSize: 24 }}>👥</span>
                  <div>
                    <span style={{ color: TEXT_MUTED_COLOR }}>Book club: </span>
                    <span style={{ color: TEXT_COLOR, fontWeight: 500 }}>{metadata.bookClubName}</span>
                  </div>
                </div>
              )}

              {privacySettings.showReadathons && metadata?.readathonName && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 18,
                  }}
                >
                  <span style={{ fontSize: 24 }}>⚡</span>
                  <div>
                    <span style={{ color: TEXT_MUTED_COLOR }}>Readathon: </span>
                    <span style={{ color: TEXT_COLOR, fontWeight: 500 }}>{metadata.readathonName}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer - Powered by Cawpile */}
        <div
          style={{
            marginTop: 'auto',
            padding: '20px 32px',
            backgroundColor: 'rgba(100, 116, 139, 0.1)',
            borderTop: `1px solid ${BORDER_COLOR}`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 16,
              color: TEXT_MUTED_COLOR,
            }}
          >
            Powered by{' '}
            <span style={{ color: ACCENT_COLOR, fontWeight: 600 }}>Cawpile</span>
          </span>
        </div>
      </div>
    </div>
  )
}
