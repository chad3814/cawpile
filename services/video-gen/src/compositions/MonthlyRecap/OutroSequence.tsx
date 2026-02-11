import React from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from 'remotion'
import { useColors, useFonts, useTiming, useSequenceConfig } from '../../lib/TemplateContext'
import { fadeIn, fadeOut, pulse } from '../../lib/animations'
import { KineticText } from '../../components/KineticText'

export const OutroSequence: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const colors = useColors()
  const fonts = useFonts()
  const timing = useTiming()
  const config = useSequenceConfig('outro')

  // Overall fade
  const fadeInOpacity = fadeIn(frame, 0, timing.outroFadeIn)
  const fadeOutOpacity = fadeOut(
    frame,
    timing.outroTotal - timing.outroFadeOut,
    timing.outroFadeOut
  )
  const opacity = Math.min(fadeInOpacity, fadeOutOpacity)

  // Logo pulse
  const pulseScale = 1 + pulse(frame, fps, 0.5) * 0.03

  // Logo animation
  const logoScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 150, mass: 0.6 },
  })

  // Render based on layout
  switch (config.layout) {
    case 'minimal':
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
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                transform: `scale(${logoScale})`,
                fontFamily: fonts.heading,
                fontSize: 60,
                fontWeight: 900,
                color: colors.accent,
                letterSpacing: -2,
              }}
            >
              cawpile
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )

    case 'branded':
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
              background: `radial-gradient(circle at 50% 50%, ${colors.accent}20 0%, transparent 60%)`,
            }}
          />

          <AbsoluteFill
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 30,
            }}
          >
            {/* Logo/Brand with pulse */}
            <div
              style={{
                transform: `scale(${logoScale * pulseScale})`,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 100,
                  fontWeight: 900,
                  color: colors.accent,
                  letterSpacing: -2,
                }}
              >
                cawpile
              </div>
            </div>

            {/* Tagline */}
            <div
              style={{
                opacity: fadeIn(frame, 20, 15),
              }}
            >
              <KineticText
                text="Track Your Reading Journey"
                startFrame={25}
                style="fadeUp"
                fontSize={32}
                color={colors.textSecondary}
                fontWeight={400}
                letterSpacing={2}
              />
            </div>

            {/* Custom text if provided */}
            {config.customText && (
              <div
                style={{
                  marginTop: 20,
                  opacity: fadeIn(frame, 40, 10),
                  fontFamily: fonts.body,
                  fontSize: 24,
                  color: colors.textMuted,
                  textAlign: 'center',
                  maxWidth: 600,
                }}
              >
                {config.customText}
              </div>
            )}

            {/* Website */}
            <div
              style={{
                marginTop: 40,
                opacity: fadeIn(frame, 35, 10),
                fontFamily: fonts.mono,
                fontSize: 28,
                color: colors.textMuted,
              }}
            >
              cawpile.org
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )

    case 'centered':
    default:
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
              background: `radial-gradient(circle at 50% 50%, ${colors.accent}10 0%, transparent 60%)`,
            }}
          />

          <AbsoluteFill
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 40,
            }}
          >
            {/* Logo/Brand */}
            {config.showBranding && (
              <div
                style={{
                  transform: `scale(${logoScale * pulseScale})`,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: 80,
                    fontWeight: 900,
                    color: colors.accent,
                    letterSpacing: -2,
                  }}
                >
                  cawpile
                </div>
              </div>
            )}

            {/* Tagline */}
            <div
              style={{
                opacity: fadeIn(frame, 20, 15),
              }}
            >
              <KineticText
                text="Track Your Reading Journey"
                startFrame={25}
                style="fadeUp"
                fontSize={28}
                color={colors.textSecondary}
                fontWeight={400}
                letterSpacing={2}
              />
            </div>

            {/* Custom text if provided */}
            {config.customText && (
              <div
                style={{
                  marginTop: 10,
                  opacity: fadeIn(frame, 40, 10),
                  fontFamily: fonts.body,
                  fontSize: 22,
                  color: colors.textMuted,
                  textAlign: 'center',
                  maxWidth: 600,
                }}
              >
                {config.customText}
              </div>
            )}

            {/* Website */}
            <div
              style={{
                marginTop: 40,
                opacity: fadeIn(frame, 35, 10),
                fontFamily: fonts.mono,
                fontSize: 24,
                color: colors.textMuted,
              }}
            >
              cawpile.org
            </div>
          </AbsoluteFill>
        </AbsoluteFill>
      )
  }
}

export default OutroSequence
