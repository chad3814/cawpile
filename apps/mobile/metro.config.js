const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Set project root explicitly for expo-router and entry point resolution
config.projectRoot = projectRoot;

// Watch only the specific workspace directories Metro needs, not the entire monorepo
config.watchFolders = [
  path.resolve(monorepoRoot, "packages/shared"),
];

// Resolve node_modules from both the project and monorepo root (for hoisted deps)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
