import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import { useColors, useTiming, useSequenceConfig } from '../../lib/TemplateContext'
import { KineticText } from '../../components/KineticText'
import { fadeIn, fadeOut } from '../../lib/animations'

interface IntroSequenceProps {
  monthName: string
  year: number
  bookCount: number
}

/**
 * Centered layout - default layout with centered text
 */
const CenteredLayout: React.FC<IntroSequenceProps & { colors: ReturnType<typeof useColors>; timing: ReturnType<typeof useTiming>; config: ReturnType<typeof useSequenceConfig<'intro'>> }> = ({
  monthName,
  year,
  bookCount,
  colors,
  timing,
  config,
}) => {
  const frame = useCurrentFrame()
  useVideoConfig()

  // Fade in at start, fade out at end
  const fadeInOpacity = fadeIn(frame, 0, timing.introFadeIn)
  const fadeOutOpacity = fadeOut(frame, timing.introTotal - timing.introFadeOut, timing.introFadeOut)
  const opacity = Math.min(fadeInOpacity, fadeOutOpacity)

  // Subtle background animation
  const bgScale = interpolate(frame, [0, timing.introTotal], [1.05, 1], {
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        opacity,
      }}
    >
      {/* Animated gradient background */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${colors.backgroundTertiary} 0%, ${colors.background} 70%)`,
          transform: `scale(${bgScale})`,
        }}
      />

      {/* Grain overlay */}
      <AbsoluteFill
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Content */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {/* "READING RECAP" header */}
        <div style={{ marginBottom: 40 }}>
          <KineticText
            text="READING RECAP"
            startFrame={5}
            style="fadeUp"
            fontSize={32}
            color={colors.accent}
            fontWeight={600}
            letterSpacing={8}
          />
        </div>

        {/* Month name - big slam animation */}
        <KineticText
          text={monthName.toUpperCase()}
          startFrame={15}
          style="slam"
          fontSize={config.titleFontSize}
          color={colors.textPrimary}
          fontWeight={900}
          letterSpacing={-4}
        />

        {/* Year */}
        {config.showYear && (
          <div style={{ marginTop: 20 }}>
            <KineticText
              text={year.toString()}
              startFrame={25}
              style="fadeUp"
              fontSize={config.subtitleFontSize}
              color={colors.textSecondary}
              fontWeight={300}
              letterSpacing={12}
            />
          </div>
        )}

        {/* Book count teaser */}
        <div style={{ marginTop: 80 }}>
          <KineticText
            text={`${bookCount} ${bookCount === 1 ? 'BOOK' : 'BOOKS'} FINISHED`}
            startFrame={40}
            style="scaleIn"
            fontSize={36}
            color={colors.textMuted}
            fontWeight={500}
            letterSpacing={4}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/**
 * Split layout - text split across screen areas
 */
const SplitLayout: React.FC<IntroSequenceProps & { colors: ReturnType<typeof useColors>; timing: ReturnType<typeof useTiming>; config: ReturnType<typeof useSequenceConfig<'intro'>> }> = ({
  monthName,
  year,
  bookCount,
  colors,
  timing,
  config,
}) => {
  const frame = useCurrentFrame()
  useVideoConfig()

  const fadeInOpacity = fadeIn(frame, 0, timing.introFadeIn)
  const fadeOutOpacity = fadeOut(frame, timing.introTotal - timing.introFadeOut, timing.introFadeOut)
  const opacity = Math.min(fadeInOpacity, fadeOutOpacity)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        opacity,
      }}
    >
      {/* Top section */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          padding: 80,
        }}
      >
        <KineticText
          text="READING RECAP"
          startFrame={5}
          style="fadeUp"
          fontSize={28}
          color={colors.accent}
          fontWeight={600}
          letterSpacing={8}
        />
      </AbsoluteFill>

      {/* Center section */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KineticText
          text={monthName.toUpperCase()}
          startFrame={15}
          style="slam"
          fontSize={config.titleFontSize}
          color={colors.textPrimary}
          fontWeight={900}
          letterSpacing={-4}
        />
        {config.showYear && (
          <div style={{ marginTop: 20 }}>
            <KineticText
              text={year.toString()}
              startFrame={25}
              style="fadeUp"
              fontSize={config.subtitleFontSize}
              color={colors.textSecondary}
              fontWeight={300}
              letterSpacing={12}
            />
          </div>
        )}
      </AbsoluteFill>

      {/* Bottom section */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: 80,
        }}
      >
        <KineticText
          text={`${bookCount} ${bookCount === 1 ? 'BOOK' : 'BOOKS'}`}
          startFrame={40}
          style="scaleIn"
          fontSize={36}
          color={colors.textMuted}
          fontWeight={500}
          letterSpacing={4}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/**
 * Minimal layout - reduced visual elements
 */
const MinimalLayout: React.FC<IntroSequenceProps & { colors: ReturnType<typeof useColors>; timing: ReturnType<typeof useTiming>; config: ReturnType<typeof useSequenceConfig<'intro'>> }> = ({
  monthName,
  year,
  bookCount: _bookCount, // Intentionally unused in minimal layout
  colors,
  timing,
  config,
}) => {
  const frame = useCurrentFrame()
  useVideoConfig()

  const fadeInOpacity = fadeIn(frame, 0, timing.introFadeIn)
  const fadeOutOpacity = fadeOut(frame, timing.introTotal - timing.introFadeOut, timing.introFadeOut)
  const opacity = Math.min(fadeInOpacity, fadeOutOpacity)

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        opacity,
      }}
    >
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <KineticText
          text={monthName.toUpperCase()}
          startFrame={10}
          style="fadeUp"
          fontSize={config.titleFontSize * 0.8}
          color={colors.textPrimary}
          fontWeight={700}
          letterSpacing={0}
        />
        {config.showYear && (
          <div style={{ marginTop: 10 }}>
            <KineticText
              text={year.toString()}
              startFrame={20}
              style="fadeUp"
              fontSize={config.subtitleFontSize * 0.8}
              color={colors.textMuted}
              fontWeight={300}
              letterSpacing={4}
            />
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export const IntroSequence: React.FC<IntroSequenceProps> = (props) => {
  const colors = useColors()
  const timing = useTiming()
  const config = useSequenceConfig('intro')

  const layoutProps = { ...props, colors, timing, config }

  switch (config.layout) {
    case 'split':
      return <SplitLayout {...layoutProps} />
    case 'minimal':
      return <MinimalLayout {...layoutProps} />
    case 'centered':
    default:
      return <CenteredLayout {...layoutProps} />
  }
}

export default IntroSequence
