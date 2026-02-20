import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Allow tests to import from src using relative paths
    },
  },
  test: {
    globals: true,
    include: ['__tests__/**/*.test.ts'],
  },
});
