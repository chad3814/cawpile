import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  // Limit workers to prevent database connection contention in parallel tests
  maxWorkers: 1,
  // Use jsdom for component tests, node for API/database tests
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^nanoid$': '<rootDir>/__mocks__/nanoid.ts',
  },
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }]
  },
  // Use node environment for specific test files
  testEnvironmentOptions: {
    customExportConditions: [''],
    url: 'http://localhost:3000',
  },
}

export default config
