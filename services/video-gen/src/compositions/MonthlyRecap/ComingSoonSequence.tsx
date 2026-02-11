import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
} from 'remotion'
import { useColors, useFonts, useTiming, useSequenceConfig } from '../../lib/TemplateContext'
import { fadeIn, fadeOut, staggerDelay } from '../../lib/animations'
import { KineticText } from '../../components/KineticText'
import type { RecapCurrentlyReading } from '../../lib/types'

interface ComingSoonSequenceProps {
  books: RecapCurrentlyReading[]
}

interface BookCardProps {
  book: RecapCurrentlyReading
  index: number
}

const BookCard: React.FC<BookCardProps> = ({ book, index }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const colors = useColors()
  const fonts = useFonts()
  const config = useSequenceConfig('comingSoon')

  const delay = staggerDelay(index, 8)
  const startFrame = 20 + delay

  const scale = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12, stiffness: 150, mass: 0.5 },
  })

  const translateY = interpolate(scale, [0, 1], [50, 0])
  const opacity = interpolate(scale, [0, 0.5, 1], [0, 1, 1])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
      }}
    >
      {/* Cover */}
      {book.coverUrl ? (
        <Img
          src={book.coverUrl}
          style={{
            width: 160,
            height: 240,
            objectFit: 'cover',
            borderRadius: 10,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          }}
        />
      ) : (
        <div
          style={{
            width: 160,
            height: 240,
            backgroundColor: colors.backgroundTertiary,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
          }}
        >
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 14,
              color: colors.textMuted,
              textAlign: 'center',
            }}
          >
            {book.title}
          </span>
        </div>
      )}

      {/* Title */}
      <div
        style={{
          fontFamily: fonts.heading,
          fontSize: 18,
          fontWeight: 600,
          color: colors.textPrimary,
          textAlign: 'center',
          maxWidth: 180,
          lineHeight: 1.3,
        }}
      >
        {book.title.length > 30 ? book.title.slice(0, 30) + '...' : book.title}
      </div>

      {/* Progress bar */}
      {config.showProgress && (
        <>
          <div
            style={{
              width: 140,
              height: 8,
              backgroundColor: colors.backgroundTertiary,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${book.progress}%`,
                height: '100%',
                backgroundColor: colors.accent,
                borderRadius: 4,
              }}
            />
          </div>

          {/* Progress text */}
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: 14,
              color: colors.textMuted,
            }}
          >
            {Math.round(book.progress)}%
          </div>
        </>
      )}
    </div>
  )
}

export const ComingSoonSequence: React.FC<ComingSoonSequenceProps> = ({
  books,
}) => {
  const frame = useCurrentFrame()
  const colors = useColors()
  const fonts = useFonts()
  const timing = useTiming()
  const config = useSequenceConfig('comingSoon')

  // Overall fade
  const fadeInOpacity = fadeIn(frame, 0, timing.comingSoonFadeIn)
  const fadeOutOpacity = fadeOut(
    frame,
    timing.comingSoonTotal - timing.comingSoonFadeOut,
    timing.comingSoonFadeOut
  )
  const opacity = Math.min(fadeInOpacity, fadeOutOpacity)

  // Limit books based on config
  const displayBooks = books.slice(0, config.maxBooks)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        opacity,
      }}
    >
      {/* Background gradient */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${colors.background} 0%, ${colors.backgroundSecondary} 100%)`,
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
          gap: 60,
        }}
      >
        {/* Header */}
        <KineticText
          text="COMING SOON..."
          startFrame={5}
          style="slam"
          fontSize={64}
          color={colors.accent}
          fontWeight={800}
          letterSpacing={4}
        />

        {/* Subheader */}
        <div
          style={{
            opacity: fadeIn(frame, 15, 10),
            fontFamily: fonts.body,
            fontSize: 28,
            color: colors.textSecondary,
          }}
        >
          Currently Reading
        </div>

        {/* Book cards grid */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 40,
            maxWidth: 900,
          }}
        >
          {displayBooks.map((book, index) => (
            <BookCard key={book.id} book={book} index={index} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export default ComingSoonSequence
