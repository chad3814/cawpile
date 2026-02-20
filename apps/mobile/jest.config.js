/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFiles: [
    "<rootDir>/jest.setup.js",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@cawpile/shared$": "<rootDir>/../../packages/shared/src/index.ts",
  },
  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/ios/",
    "/android/",
  ],
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|nativewind|@tanstack|@react-native-async-storage|@react-native-google-signin|expo-modules-core))",
    "/node_modules/react-native-reanimated/plugin/",
  ],
};
