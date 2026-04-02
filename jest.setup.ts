import '@testing-library/jest-dom'
import { config } from 'dotenv'
import React from 'react'

// Load environment variables from .env.local for tests
config({ path: '.env.local' })

// Make React available globally for JSX transform
global.React = React

// JSDOM does not implement ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
