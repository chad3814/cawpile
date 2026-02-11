import React from 'react'
import { AbsoluteFill, Sequence, useVideoConfig } from 'remotion'
import type { MonthlyRecapExport } from '../../lib/types'
import type { VideoTemplate } from '../../lib/template-types'
import { getEffectiveTemplate, DEFAULT_TEMPLATE } from '../../lib/template-types'
import { TemplateProvider, useColors, useTiming } from '../../lib/TemplateContext'
import { IntroSequence } from './IntroSequence'
import { BookReveal } from './BookReveal'
import { StatsReveal } from './StatsReveal'
import { ComingSoonSequence } from './ComingSoonSequence'
import { OutroSequence } from './OutroSequence'

export interface MonthlyRecapProps {
  data: MonthlyRecapExport
  template?: Partial<VideoTemplate>
}

/**
 * Calculate total duration based on content and template timing
 */
export function calculateDuration(
  data: MonthlyRecapExport,
  template?: Partial<VideoTemplate>
): number {
  // Get effective template with merged timing values
  const effectiveTemplate = template ? getEffectiveTemplate(template) : DEFAULT_TEMPLATE
  const timing = effectiveTemplate.global.timing
  const bookRevealLayout = effectiveTemplate.bookReveal.layout

  const introFrames = timing.introTotal

  // Calculate book frames based on layout
  let bookFrames: number
  if (bookRevealLayout === 'grid') {
    // Grid layout: all books shown at once, shorter duration
    bookFrames = data.books.length > 0 ? timing.bookTotal : 0
  } else {
    // Sequential (default) and carousel: per-book timing
    bookFrames = data.books.length * timing.bookTotal
  }

  const statsFrames = timing.statsTotal
  const comingSoonFrames = data.currentlyReading.length > 0 ? timing.comingSoonTotal : 0
  const outroFrames = timing.outroTotal

  // Subtract overlaps between sequences
  let overlaps: number
  if (bookRevealLayout === 'grid') {
    // Grid layout: fewer overlaps since all books shown at once
    overlaps = timing.transitionOverlap * (
      1 + // intro -> books
      (data.books.length > 0 ? 1 : 0) + // books -> stats
      (data.currentlyReading.length > 0 ? 1 : 0) + // stats -> coming soon
      1 // -> outro
    )
  } else {
    // Sequential layout: overlaps between each book
    overlaps = timing.transitionOverlap * (
      1 + // intro -> books
      (data.books.length > 0 ? data.books.length : 0) + // between books and to stats
      (data.currentlyReading.length > 0 ? 1 : 0) + // stats -> coming soon
      1 // -> outro
    )
  }

  return introFrames + bookFrames + statsFrames + comingSoonFrames + outroFrames - overlaps
}

/**
 * Internal component that uses template context
 */
const MonthlyRecapContent: React.FC<{ data: MonthlyRecapExport }> = ({ data }) => {
  useVideoConfig()
  const colors = useColors()
  const timing = useTiming()

  // Calculate frame positions for each sequence
  let currentFrame = 0

  const introStart = currentFrame
  currentFrame += timing.introTotal - timing.transitionOverlap

  const bookStarts: number[] = []
  for (let i = 0; i < data.books.length; i++) {
    bookStarts.push(currentFrame)
    currentFrame += timing.bookTotal - timing.transitionOverlap
  }

  const statsStart = currentFrame
  currentFrame += timing.statsTotal - timing.transitionOverlap

  const comingSoonStart = data.currentlyReading.length > 0 ? currentFrame : -1
  if (data.currentlyReading.length > 0) {
    currentFrame += timing.comingSoonTotal - timing.transitionOverlap
  }

  const outroStart = currentFrame

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      {/* Intro */}
      <Sequence from={introStart} durationInFrames={timing.introTotal}>
        <IntroSequence
          monthName={data.meta.monthName}
          year={data.meta.year}
          bookCount={data.stats.totalBooks}
        />
      </Sequence>

      {/* Book reveals */}
      {data.books.map((book, index) => (
        <Sequence
          key={book.id}
          from={bookStarts[index]}
          durationInFrames={timing.bookTotal}
        >
          <BookReveal book={book} index={index} random={Math.random()} />
        </Sequence>
      ))}

      {/* Stats */}
      <Sequence from={statsStart} durationInFrames={timing.statsTotal}>
        <StatsReveal stats={data.stats} />
      </Sequence>

      {/* Coming Soon (only if there are currently reading books) */}
      {data.currentlyReading.length > 0 && (
        <Sequence from={comingSoonStart} durationInFrames={timing.comingSoonTotal}>
          <ComingSoonSequence books={data.currentlyReading} />
        </Sequence>
      )}

      {/* Outro */}
      <Sequence from={outroStart} durationInFrames={timing.outroTotal}>
        <OutroSequence />
      </Sequence>
    </AbsoluteFill>
  )
}

export const MonthlyRecap: React.FC<MonthlyRecapProps> = ({ data, template }) => {
  // Merge provided template with defaults
  const effectiveTemplate = getEffectiveTemplate(template)

  return (
    <TemplateProvider template={effectiveTemplate}>
      <MonthlyRecapContent data={data} />
    </TemplateProvider>
  )
}

export default MonthlyRecap
