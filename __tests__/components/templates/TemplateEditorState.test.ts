/**
 * @jest-environment node
 */
import { DEFAULT_TEMPLATE } from '@/types/video-template'
import type { ResolvedVideoTemplate } from '@/types/video-template'
import {
  buildInitialState,
  editorReducer,
  assembleConfig,
  type EditorState,
  type EditorAction,
} from '@/components/templates/TemplateEditorClient'

// Mock the timing calculation module
jest.mock('@/lib/video/timingCalculation', () => ({
  calculateSubTimings: jest.fn(),
  assembleFullTimingConfig: jest.fn((totals: Record<string, number>) => totals),
}))

import { assembleFullTimingConfig } from '@/lib/video/timingCalculation'

function makeResolvedTemplate(overrides: Partial<ResolvedVideoTemplate> = {}): ResolvedVideoTemplate {
  return {
    ...DEFAULT_TEMPLATE,
    global: {
      ...DEFAULT_TEMPLATE.global,
      backgroundImage: 'https://example.com/global-bg.jpg',
      backgroundOverlayOpacity: 0.5,
      ...overrides.global,
    },
    intro: {
      ...DEFAULT_TEMPLATE.intro,
      backgroundImage: 'https://example.com/intro-bg.jpg',
      backgroundOverlayOpacity: 0.3,
      ...overrides.intro,
    },
    bookReveal: {
      ...DEFAULT_TEMPLATE.bookReveal,
      backgroundImage: null,
      backgroundOverlayOpacity: 0.5,
      ...overrides.bookReveal,
    },
    statsReveal: {
      ...DEFAULT_TEMPLATE.statsReveal,
      backgroundImage: null,
      backgroundOverlayOpacity: 0.5,
      ...overrides.statsReveal,
    },
    comingSoon: {
      ...DEFAULT_TEMPLATE.comingSoon,
      backgroundImage: null,
      backgroundOverlayOpacity: 0.5,
      ...overrides.comingSoon,
    },
    outro: {
      ...DEFAULT_TEMPLATE.outro,
      backgroundImage: null,
      backgroundOverlayOpacity: 0.5,
      ...overrides.outro,
    },
  }
}

describe('TemplateEditorClient State Management', () => {
  describe('buildInitialState', () => {
    it('should populate backgroundImage and backgroundOverlayOpacity from resolved template at global and sequence levels', () => {
      const template = makeResolvedTemplate()
      const state = buildInitialState(template)

      // Global level
      expect(state.globalBackgroundImage).toBe('https://example.com/global-bg.jpg')
      expect(state.globalBackgroundOverlayOpacity).toBe(0.5)

      // Sequence level
      expect(state.intro.backgroundImage).toBe('https://example.com/intro-bg.jpg')
      expect(state.intro.backgroundOverlayOpacity).toBe(0.3)
      expect(state.bookReveal.backgroundImage).toBe(null)
      expect(state.bookReveal.backgroundOverlayOpacity).toBe(0.5)
    })
  })

  describe('editorReducer', () => {
    it('should update global background image with SET_GLOBAL_BACKGROUND_IMAGE action', () => {
      const template = makeResolvedTemplate()
      const initialState = buildInitialState(template)

      const action: EditorAction = {
        type: 'SET_GLOBAL_BACKGROUND_IMAGE',
        value: 'https://example.com/new-bg.jpg',
      }
      const newState = editorReducer(initialState, action)
      expect(newState.globalBackgroundImage).toBe('https://example.com/new-bg.jpg')

      // Test clearing to null
      const clearAction: EditorAction = {
        type: 'SET_GLOBAL_BACKGROUND_IMAGE',
        value: null,
      }
      const clearedState = editorReducer(newState, clearAction)
      expect(clearedState.globalBackgroundImage).toBe(null)
    })

    it('should update global overlay opacity with SET_GLOBAL_BACKGROUND_OVERLAY_OPACITY action', () => {
      const template = makeResolvedTemplate()
      const initialState = buildInitialState(template)

      const action: EditorAction = {
        type: 'SET_GLOBAL_BACKGROUND_OVERLAY_OPACITY',
        value: 0.9,
      }
      const newState = editorReducer(initialState, action)
      expect(newState.globalBackgroundOverlayOpacity).toBe(0.9)
    })
  })

  describe('assembleConfig', () => {
    it('should include background image URLs and overlay opacity in the output config JSON at both global and sequence levels', () => {
      const template = makeResolvedTemplate()
      const state = buildInitialState(template)

      // Override some values
      state.globalBackgroundImage = 'https://example.com/assembled-bg.jpg'
      state.globalBackgroundOverlayOpacity = 0.6
      state.intro.backgroundImage = 'https://example.com/intro-override.jpg'
      state.intro.backgroundOverlayOpacity = 0.4
      state.bookReveal.backgroundImage = null
      state.bookReveal.backgroundOverlayOpacity = null

      const config = assembleConfig(state, assembleFullTimingConfig)

      // Global
      expect(config.global?.backgroundImage).toBe('https://example.com/assembled-bg.jpg')
      expect(config.global?.backgroundOverlayOpacity).toBe(0.6)

      // Intro (overridden)
      expect(config.intro?.backgroundImage).toBe('https://example.com/intro-override.jpg')
      expect(config.intro?.backgroundOverlayOpacity).toBe(0.4)

      // BookReveal (inheriting = null)
      expect(config.bookReveal?.backgroundImage).toBe(null)
      expect(config.bookReveal?.backgroundOverlayOpacity).toBe(null)
    })
  })
})
