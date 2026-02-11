import { interpolate, spring, Easing } from 'remotion'

/**
 * Animation utility functions for consistent motion design
 */

// Standard easing curves
export const EASING = {
  easeOut: Easing.out(Easing.cubic),
  easeIn: Easing.in(Easing.cubic),
  easeInOut: Easing.inOut(Easing.cubic),
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),
} as const

// Fade animations
export function fadeIn(frame: number, startFrame: number, duration: number): number {
  return interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.easeOut,
  })
}

export function fadeOut(frame: number, startFrame: number, duration: number): number {
  return interpolate(frame, [startFrame, startFrame + duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.easeIn,
  })
}

// Slide animations
export function slideInFromLeft(
  frame: number,
  startFrame: number,
  duration: number,
  distance: number = 100
): number {
  return interpolate(frame, [startFrame, startFrame + duration], [-distance, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.easeOut,
  })
}

export function slideInFromRight(
  frame: number,
  startFrame: number,
  duration: number,
  distance: number = 100
): number {
  return interpolate(frame, [startFrame, startFrame + duration], [distance, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.easeOut,
  })
}

export function slideInFromBottom(
  frame: number,
  startFrame: number,
  duration: number,
  distance: number = 100
): number {
  return interpolate(frame, [startFrame, startFrame + duration], [distance, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.easeOut,
  })
}

// Scale animations
export function scaleIn(
  frame: number,
  startFrame: number,
  duration: number,
  fps: number = 30
): number {
  return spring({
    frame: frame - startFrame,
    fps,
    config: {
      damping: 12,
      stiffness: 200,
      mass: 0.5,
    },
  })
}

export function popIn(
  frame: number,
  startFrame: number,
  fps: number = 30
): number {
  return spring({
    frame: frame - startFrame,
    fps,
    config: {
      damping: 10,
      stiffness: 400,
      mass: 0.3,
    },
  })
}

// Counter animation (for counting up numbers)
export function countUp(
  frame: number,
  startFrame: number,
  duration: number,
  endValue: number,
  startValue: number = 0
): number {
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASING.easeOut,
  })
  return Math.round(startValue + (endValue - startValue) * progress)
}

// Typewriter effect
export function typewriter(
  frame: number,
  startFrame: number,
  text: string,
  charsPerFrame: number = 0.5
): string {
  const elapsed = Math.max(0, frame - startFrame)
  const charCount = Math.min(Math.floor(elapsed * charsPerFrame), text.length)
  return text.slice(0, charCount)
}

// Stagger delay calculator for list items
export function staggerDelay(index: number, delayPerItem: number = 3): number {
  return index * delayPerItem
}

// Shake animation (for emphasis)
export function shake(
  frame: number,
  startFrame: number,
  duration: number,
  intensity: number = 5
): number {
  if (frame < startFrame || frame > startFrame + duration) return 0
  const progress = (frame - startFrame) / duration
  const decay = 1 - progress
  return Math.sin(progress * Math.PI * 8) * intensity * decay
}

// Pulse animation
export function pulse(
  frame: number,
  fps: number = 30,
  frequency: number = 1
): number {
  const time = frame / fps
  return 0.5 + 0.5 * Math.sin(time * Math.PI * 2 * frequency)
}
