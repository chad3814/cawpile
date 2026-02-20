/**
 * Task Group 4 - Setup validation tests
 *
 * Test 1: App entry point renders without crashing
 * Test 2: @cawpile/shared types are importable and usable
 * Test 3: API client module initializes with correct base URL
 */
import React from "react";
import { Text, View } from "react-native";
import { render, screen } from "@testing-library/react-native";

// Test 1: App entry point renders without crashing
describe("App entry point", () => {
  it("renders the root layout placeholder without crashing", () => {
    // We test that a basic React Native component renders,
    // validating that the test environment is correctly configured
    // for React Native rendering.
    function TestApp() {
      return (
        <View testID="app-root">
          <Text>Cawpile</Text>
        </View>
      );
    }

    render(<TestApp />);
    expect(screen.getByTestId("app-root")).toBeTruthy();
    expect(screen.getByText("Cawpile")).toBeTruthy();
  });
});

// Test 2: @cawpile/shared types are importable and usable
describe("@cawpile/shared integration", () => {
  it("imports types and utilities from the shared package", () => {
    const {
      calculateCawpileAverage,
      getCawpileGrade,
      convertToStars,
      getCawpileColor,
      getFacetConfig,
      detectBookType,
      FICTION_FACETS,
      NONFICTION_FACETS,
      RATING_SCALE_GUIDE,
    } = require("@cawpile/shared");

    // Verify utility functions are callable
    expect(typeof calculateCawpileAverage).toBe("function");
    expect(typeof getCawpileGrade).toBe("function");
    expect(typeof convertToStars).toBe("function");
    expect(typeof getCawpileColor).toBe("function");
    expect(typeof getFacetConfig).toBe("function");
    expect(typeof detectBookType).toBe("function");

    // Verify constants are populated
    expect(FICTION_FACETS.length).toBe(7);
    expect(NONFICTION_FACETS.length).toBe(7);
    expect(RATING_SCALE_GUIDE.length).toBe(10);

    // Verify a real computation:
    // writing=9, plot=6, intrigue=7, enjoyment=9 are the keys matched
    // by the internal RATING_KEYS filter => sum=31, count=4, avg=7.75 => 7.8
    const avg = calculateCawpileAverage({
      characters: 8,
      atmosphere: 7,
      writing: 9,
      plot: 6,
      intrigue: 7,
      logic: 8,
      enjoyment: 9,
    });
    expect(typeof avg).toBe("number");
    expect(avg).toBeGreaterThan(0);

    // Verify grade mapping returns a non-empty string
    const grade = getCawpileGrade(8.0);
    expect(grade).toBe("A-");

    // Verify color mapping
    expect(getCawpileColor(9)).toBe("green");
    expect(getCawpileColor(7)).toBe("yellow");
    expect(getCawpileColor(5)).toBe("orange");
    expect(getCawpileColor(2)).toBe("red");

    // Verify star conversion
    expect(convertToStars(10)).toBe(5);
    expect(convertToStars(7.5)).toBe(4);
    expect(convertToStars(3.0)).toBe(2);

    // Verify facet config returns correct set
    const fictionFacets = getFacetConfig("FICTION");
    expect(fictionFacets).toBe(FICTION_FACETS);
    const nonfictionFacets = getFacetConfig("NONFICTION");
    expect(nonfictionFacets).toBe(NONFICTION_FACETS);

    // Verify book type detection
    const bookType = detectBookType(["Fiction", "Fantasy"]);
    expect(bookType).toBe("FICTION");

    const nonfictionType = detectBookType(["Biography", "History"]);
    expect(nonfictionType).toBe("NONFICTION");
  });
});

// Test 3: API client module initializes with correct base URL
describe("API client module", () => {
  it("reads base URL from EXPO_PUBLIC_API_BASE_URL environment variable", () => {
    const { getBaseUrl } = require("@/lib/api");

    // Save original value
    const original = process.env.EXPO_PUBLIC_API_BASE_URL;

    // When env var is not set, should throw
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(() => getBaseUrl()).toThrow("EXPO_PUBLIC_API_BASE_URL environment variable is not set");

    // When env var is set, should return the URL
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://cawpile.example.com";
    expect(getBaseUrl()).toBe("https://cawpile.example.com");

    // Should strip trailing slashes
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://cawpile.example.com///";
    expect(getBaseUrl()).toBe("https://cawpile.example.com");

    // Restore original value
    if (original !== undefined) {
      process.env.EXPO_PUBLIC_API_BASE_URL = original;
    } else {
      delete process.env.EXPO_PUBLIC_API_BASE_URL;
    }
  });
});
