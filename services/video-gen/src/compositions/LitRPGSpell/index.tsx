import React, { useState, useEffect } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Audio,
  staticFile,
  interpolate,
  spring,
  delayRender,
  continueRender,
} from 'remotion';
import { ICON_MAP } from './Icons';

// =============================================================================
// TIMING CONSTANTS (frame numbers at 30fps)
// Adjust these to sync with the audio beats.
// Preview in Remotion Studio: npm run dev
// =============================================================================
const LETTER_TIMINGS: Record<string, number> = {
  L: 280,   // ~2.0s - "L, is for the way you love me"
  i: 400,  // ~7.0s - "I am the only one you see"
  t: 500,  // ~12.0s - "Tea, I drink it daily"
  R: 600,  // ~17.0s - "and RPG..."
  P: 620,  // ~19.0s - "...Rocket, Pencil..."
  G: 640,  // ~21.0s - "...Gauge"
};

// Duration & total
export const DURATION_FRAMES = 871; // 29.02s * 30fps

// Animation durations (frames)
const LETTER_SPRING_CONFIG = { damping: 8, stiffness: 80, mass: 0.8 };
const ICON_DELAY_AFTER_LETTER = 18; // frames after letter starts dropping
const ICON_POP_CONFIG = { damping: 10, stiffness: 300, mass: 0.4 };
const ICON_SHRINK_GLIDE_CONFIG = { damping: 12, stiffness: 60, mass: 0.7 };
const ICON_HOLD_BIG_FRAMES = 20; // how long to hold at big size before shrinking

// Layout (1080x1920)
const SCREEN_W = 1080;
const SCREEN_H = 1920;
const TITLE_Y = SCREEN_H * 0.10;
const LETTER_Y = SCREEN_H * 0.78; // letters land here (20% from bottom-ish)
const ICON_TARGET_Y = LETTER_Y - 200; // icons rest above letters

// Letter x-positions: evenly spaced across screen
const LETTERS = ['L', 'i', 't', 'R', 'P', 'G'] as const;
const LETTER_X: number[] = LETTERS.map((_, i) => {
  const padding = 100;
  const usable = SCREEN_W - padding * 2;
  return padding + (usable / (LETTERS.length - 1)) * i;
});

// Visual
const BG_COLOR = '#D4654A';
const TEXT_COLOR = '#FFFFFF';
const LETTER_FONT_SIZE = 140;
const ICON_SIZE = 130;
const ICON_BIG_SCALE = (SCREEN_W * 0.8) / ICON_SIZE; // ~6.6x - fills 80% of width
const TITLE_FONT_SIZE = 96;

// Fade out at end
const FADE_OUT_START = DURATION_FRAMES - 90; // 3 seconds before end

// =============================================================================
// Font Loading
// =============================================================================
const useFonts = () => {
  const [handle] = useState(() => delayRender('Loading Google Fonts'));

  useEffect(() => {
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Fredoka:wght@600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    document.fonts.ready.then(() => {
      continueRender(handle);
    });

    return () => {
      document.head.removeChild(link);
    };
  }, [handle]);
};

// =============================================================================
// Main Composition
// =============================================================================
export const LitRPGSpell: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  useFonts();

  // Global fade out near end
  const globalOpacity = interpolate(
    frame,
    [FADE_OUT_START, DURATION_FRAMES],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: BG_COLOR }}>
      <Audio src={staticFile('litrpg.mp3')} />

      <div style={{ opacity: globalOpacity, width: '100%', height: '100%' }}>
        {/* Title */}
        <Title frame={frame} fps={fps} />

        {/* Letters and Icons */}
        {LETTERS.map((letter, index) => {
          const startFrame = LETTER_TIMINGS[letter];
          const x = LETTER_X[index];

          return (
            <React.Fragment key={letter}>
              <AnimatedLetter
                letter={letter}
                startFrame={startFrame}
                x={x}
                frame={frame}
                fps={fps}
                index={index}
              />
              <AnimatedIcon
                letter={letter}
                startFrame={startFrame + ICON_DELAY_AFTER_LETTER}
                targetX={x}
                targetY={ICON_TARGET_Y}
                frame={frame}
                fps={fps}
                index={index}
              />
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// =============================================================================
// Title Component
// =============================================================================
const TITLE_START_FRAME = 75; // 2.5s
const TITLE_DURATION_FRAMES = 45; // 1.5s

const Title: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  if (frame < TITLE_START_FRAME) return null;

  // Spin in from off-screen right over 1.5s
  const spinProgress = spring({
    frame: frame - TITLE_START_FRAME,
    fps,
    config: { damping: 14, stiffness: 80, mass: 0.8 },
    durationInFrames: TITLE_DURATION_FRAMES,
  });

  // Start off-screen right (SCREEN_W), end at center (0)
  const translateX = interpolate(spinProgress, [0, 1], [SCREEN_W, 0]);
  // Full rotation (360 degrees) as it spins in
  const rotation = interpolate(spinProgress, [0, 1], [360, 0]);
  const opacity = interpolate(spinProgress, [0, 0.15, 1], [0, 1, 1]);

  // Gentle floating after settled
  const settledTime = Math.max(0, (frame - TITLE_START_FRAME - TITLE_DURATION_FRAMES) / fps);
  const floatY = settledTime > 0 ? Math.sin(settledTime * Math.PI * 0.4) * 6 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: TITLE_Y,
        left: 0,
        width: '100%',
        textAlign: 'center',
        fontFamily: '"Dancing Script", "Snell Roundhand", cursive',
        fontSize: TITLE_FONT_SIZE,
        fontWeight: 900,
        color: TEXT_COLOR,
        opacity,
        transform: `translateX(${translateX}px) rotate(${rotation}deg) translateY(${floatY}px)`,
        textShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      What is LitRPG?
    </div>
  );
};

// =============================================================================
// Animated Letter Component
// =============================================================================
const AnimatedLetter: React.FC<{
  letter: string;
  startFrame: number;
  x: number;
  frame: number;
  fps: number;
  index: number;
}> = ({ letter, startFrame, x, frame, fps, index }) => {
  if (frame < startFrame) return null;

  // Drop from above with bounce
  const dropProgress = spring({
    frame: frame - startFrame,
    fps,
    config: LETTER_SPRING_CONFIG,
  });

  const y = interpolate(dropProgress, [0, 1], [-400, LETTER_Y]);

  // Continuous rocking after landing (starts ~1s after drop)
  const landedTime = Math.max(0, (frame - startFrame - 30) / fps);
  const rockPhase = index * 0.8; // stagger phase per letter
  const rockAngle = landedTime > 0
    ? Math.sin((landedTime + rockPhase) * Math.PI * 0.7) * 5
    : 0;

  // Fade in with the drop
  const opacity = interpolate(
    frame - startFrame,
    [0, 8],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rockAngle}deg)`,
        fontFamily: '"Fredoka", "Baloo 2", sans-serif',
        fontSize: LETTER_FONT_SIZE,
        fontWeight: 700,
        color: TEXT_COLOR,
        opacity,
        textShadow: '0 6px 25px rgba(0,0,0,0.35)',
        lineHeight: 1,
      }}
    >
      {letter}
    </div>
  );
};

// =============================================================================
// Animated Icon Component
// =============================================================================
const AnimatedIcon: React.FC<{
  letter: string;
  startFrame: number;
  targetX: number;
  targetY: number;
  frame: number;
  fps: number;
  index: number;
}> = ({ letter, startFrame, targetX, targetY, frame, fps, index }) => {
  if (frame < startFrame) return null;

  const IconComponent = ICON_MAP[letter];
  if (!IconComponent) return null;

  // Phase 1: Pop in BIG at screen center (0 → ICON_BIG_SCALE)
  const popProgress = spring({
    frame: frame - startFrame,
    fps,
    config: ICON_POP_CONFIG,
  });
  const bigScale = interpolate(popProgress, [0, 1], [0, ICON_BIG_SCALE]);

  // Phase 2: After holding big, shrink + glide to target position
  const shrinkStart = startFrame + ICON_HOLD_BIG_FRAMES;
  const shrinkGlideProgress = frame >= shrinkStart
    ? spring({
        frame: frame - shrinkStart,
        fps,
        config: ICON_SHRINK_GLIDE_CONFIG,
      })
    : 0;

  // Scale goes from big → 1.0 during shrink/glide
  const scale = interpolate(shrinkGlideProgress, [0, 1], [bigScale, 1]);

  // Position goes from center → target during shrink/glide
  const centerX = SCREEN_W / 2;
  const centerY = SCREEN_H / 2;
  const iconX = interpolate(shrinkGlideProgress, [0, 1], [centerX, targetX]);
  const iconY = interpolate(shrinkGlideProgress, [0, 1], [centerY, targetY]);

  // Continuous bounce after settling (~1.5s after shrink starts)
  const settledTime = Math.max(0, (frame - shrinkStart - 45) / fps);
  const bouncePhase = index * 0.6;
  const bounceY = settledTime > 0
    ? Math.sin((settledTime + bouncePhase) * Math.PI * 1.0) * 10
    : 0;

  // Opacity
  const opacity = interpolate(
    frame - startFrame,
    [0, 6],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: iconX,
        top: iconY + bounceY,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        filter: 'drop-shadow(0 4px 15px rgba(0,0,0,0.3))',
      }}
    >
      <IconComponent size={ICON_SIZE} color={TEXT_COLOR} />
    </div>
  );
};

export default LitRPGSpell;
