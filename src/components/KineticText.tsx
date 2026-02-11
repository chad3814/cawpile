import React from 'react'
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion'
import { COLORS, FONTS } from '../lib/theme'
import { staggerDelay } from '../lib/animations'

interface KineticTextProps {
  text: string
  startFrame?: number
  style?: 'slam' | 'typewriter' | 'fadeUp' | 'scaleIn'
  fontSize?: number
  color?: string
  fontWeight?: number
  letterSpacing?: number
  textAlign?: 'left' | 'center' | 'right'
}

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  startFrame = 0,
  style = 'slam',
  fontSize = 72,
  color = COLORS.textPrimary,
  fontWeight = 800,
  letterSpacing = -2,
  textAlign = 'center',
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  if (style === 'slam') {
    return <SlamText {...{ text, startFrame, fontSize, color, fontWeight, letterSpacing, textAlign, frame, fps }} />
  }

  if (style === 'typewriter') {
    return <TypewriterText {...{ text, startFrame, fontSize, color, fontWeight, letterSpacing, textAlign, frame }} />
  }

  if (style === 'fadeUp') {
    return <FadeUpText {...{ text, startFrame, fontSize, color, fontWeight, letterSpacing, textAlign, frame, fps }} />
  }

  if (style === 'scaleIn') {
    return <ScaleInText {...{ text, startFrame, fontSize, color, fontWeight, letterSpacing, textAlign, frame, fps }} />
  }

  return null
}

// Letters slam in from top with stagger
const SlamText: React.FC<{
  text: string
  startFrame: number
  fontSize: number
  color: string
  fontWeight: number
  letterSpacing: number
  textAlign: string
  frame: number
  fps: number
}> = ({ text, startFrame, fontSize, color, fontWeight, letterSpacing, textAlign, frame, fps }) => {
  const letters = text.split('')

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
        flexWrap: 'wrap',
        fontFamily: FONTS.heading,
        fontSize,
        fontWeight,
        letterSpacing,
        color,
      }}
    >
      {letters.map((letter, index) => {
        const delay = staggerDelay(index, 1)
        const letterStartFrame = startFrame + delay

        const progress = spring({
          frame: frame - letterStartFrame,
          fps,
          config: {
            damping: 15,
            stiffness: 300,
            mass: 0.5,
          },
        })

        const translateY = interpolate(progress, [0, 1], [-100, 0])
        const opacity = interpolate(progress, [0, 0.5, 1], [0, 1, 1])

        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              transform: `translateY(${translateY}px)`,
              opacity,
              whiteSpace: letter === ' ' ? 'pre' : 'normal',
            }}
          >
            {letter}
          </span>
        )
      })}
    </div>
  )
}

// Typewriter effect
const TypewriterText: React.FC<{
  text: string
  startFrame: number
  fontSize: number
  color: string
  fontWeight: number
  letterSpacing: number
  textAlign: string
  frame: number
}> = ({ text, startFrame, fontSize, color, fontWeight, letterSpacing, textAlign, frame }) => {
  const elapsed = Math.max(0, frame - startFrame)
  const charCount = Math.min(Math.floor(elapsed * 0.8), text.length)
  const displayText = text.slice(0, charCount)
  const showCursor = frame % 15 < 8 && charCount < text.length

  return (
    <div
      style={{
        fontFamily: FONTS.heading,
        fontSize,
        fontWeight,
        letterSpacing,
        color,
        textAlign: textAlign as 'left' | 'center' | 'right',
      }}
    >
      {displayText}
      {showCursor && (
        <span style={{ opacity: 0.8 }}>|</span>
      )}
    </div>
  )
}

// Fade up from bottom
const FadeUpText: React.FC<{
  text: string
  startFrame: number
  fontSize: number
  color: string
  fontWeight: number
  letterSpacing: number
  textAlign: string
  frame: number
  fps: number
}> = ({ text, startFrame, fontSize, color, fontWeight, letterSpacing, textAlign, frame, fps }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: {
      damping: 20,
      stiffness: 150,
      mass: 0.8,
    },
  })

  const translateY = interpolate(progress, [0, 1], [40, 0])
  const opacity = interpolate(progress, [0, 1], [0, 1])

  return (
    <div
      style={{
        fontFamily: FONTS.heading,
        fontSize,
        fontWeight,
        letterSpacing,
        color,
        textAlign: textAlign as 'left' | 'center' | 'right',
        transform: `translateY(${translateY}px)`,
        opacity,
      }}
    >
      {text}
    </div>
  )
}

// Scale in from center
const ScaleInText: React.FC<{
  text: string
  startFrame: number
  fontSize: number
  color: string
  fontWeight: number
  letterSpacing: number
  textAlign: string
  frame: number
  fps: number
}> = ({ text, startFrame, fontSize, color, fontWeight, letterSpacing, textAlign, frame, fps }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: {
      damping: 12,
      stiffness: 200,
      mass: 0.4,
    },
  })

  const scale = interpolate(progress, [0, 1], [0.5, 1])
  const opacity = interpolate(progress, [0, 0.5, 1], [0, 1, 1])

  return (
    <div
      style={{
        fontFamily: FONTS.heading,
        fontSize,
        fontWeight,
        letterSpacing,
        color,
        textAlign: textAlign as 'left' | 'center' | 'right',
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {text}
    </div>
  )
}

export default KineticText
