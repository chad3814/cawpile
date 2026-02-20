import { useEffect, useState } from "react";

/**
 * Generic debounce hook matching pattern from web app's useDebounce.
 * Returns the debounced value after the specified delay.
 *
 * @param value - The value to debounce
 * @param delay - Debounce delay in milliseconds (default: 600ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 600): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
