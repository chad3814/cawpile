import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Cawpile",
  slug: "cawpile",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  scheme: "cawpile",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#3b82f6",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.cawpile.mobile",
    infoPlist: {
      NSCameraUsageDescription: "Cawpile needs camera access to scan book barcodes.",
      NSPhotoLibraryUsageDescription: "Cawpile needs photo library access to set your profile picture.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#3b82f6",
    },
    package: "com.cawpile.mobile",
    edgeToEdgeEnabled: true,
    permissions: [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "INTERNET",
      "ACCESS_NETWORK_STATE",
    ],
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "cawpile-mobile",
    },
  },
});
