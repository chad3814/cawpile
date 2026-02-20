/**
 * Jest setup file for the Cawpile mobile app.
 * Mocks native modules that are not available in the test environment.
 */

// Mock @react-native-google-signin/google-signin
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({
      data: { idToken: "mock-google-id-token" },
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    configure: jest.fn(),
    isSignedIn: jest.fn().mockResolvedValue(false),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
    IN_PROGRESS: "IN_PROGRESS",
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  },
}));

// Mock expo-secure-store with a simple in-memory implementation
const secureStoreData = {};
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn((key) => Promise.resolve(secureStoreData[key] ?? null)),
  setItemAsync: jest.fn((key, value) => {
    secureStoreData[key] = value;
    return Promise.resolve();
  }),
  deleteItemAsync: jest.fn((key) => {
    delete secureStoreData[key];
    return Promise.resolve();
  }),
}));

// Mock @react-native-community/netinfo
jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: jest.fn(() => () => {}),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// Mock @react-native-async-storage/async-storage
const asyncStoreData = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((key) => Promise.resolve(asyncStoreData[key] ?? null)),
  setItem: jest.fn((key, value) => {
    asyncStoreData[key] = value;
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    delete asyncStoreData[key];
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    Object.keys(asyncStoreData).forEach((k) => delete asyncStoreData[k]);
    return Promise.resolve();
  }),
}));
