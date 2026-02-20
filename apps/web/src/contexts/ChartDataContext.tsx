'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ChartData {
  [key: string]: unknown;
}

interface ChartDataContextType {
  data: ChartData;
  loading: { [key: string]: boolean };
  error: { [key: string]: string | null };
  fetchChartData: (chartType: string, year: number, force?: boolean) => Promise<unknown>;
  clearCache: () => void;
}

const ChartDataContext = createContext<ChartDataContextType | undefined>(undefined);

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

export function ChartDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ChartData>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<{ [key: string]: string | null }>({});
  const [cacheTimestamps, setCacheTimestamps] = useState<{ [key: string]: number }>({});

  const getCacheKey = (chartType: string, year: number) => `${chartType}-${year}`;

  const fetchChartData = useCallback(async (chartType: string, year: number, force = false) => {
    const cacheKey = getCacheKey(chartType, year);

    // Check if data is cached and still valid
    if (!force && data[cacheKey] && cacheTimestamps[cacheKey]) {
      const cacheAge = Date.now() - cacheTimestamps[cacheKey];
      if (cacheAge < CACHE_TTL) {
        return data[cacheKey];
      }
    }

    // Set loading state
    setLoading(prev => ({ ...prev, [cacheKey]: true }));
    setError(prev => ({ ...prev, [cacheKey]: null }));

    try {
      const response = await fetch(`/api/charts/${chartType}?year=${year}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${chartType} data`);
      }

      const chartData = await response.json();

      // Update cache
      setData(prev => ({ ...prev, [cacheKey]: chartData }));
      setCacheTimestamps(prev => ({ ...prev, [cacheKey]: Date.now() }));

      // Store in session storage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `chart-${cacheKey}`,
          JSON.stringify({
            data: chartData,
            timestamp: Date.now()
          })
        );
      }

      return chartData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(prev => ({ ...prev, [cacheKey]: errorMessage }));
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [data, cacheTimestamps]);

  const clearCache = useCallback(() => {
    setData({});
    setCacheTimestamps({});
    if (typeof window !== 'undefined') {
      // Clear session storage
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('chart-')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }, []);

  // Load cached data from session storage on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const cachedData: ChartData = {};
      const cachedTimestamps: { [key: string]: number } = {};

      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('chart-')) {
          try {
            const cached = JSON.parse(sessionStorage.getItem(key) || '{}');
            const cacheKey = key.replace('chart-', '');

            if (cached.data && cached.timestamp) {
              const cacheAge = Date.now() - cached.timestamp;
              if (cacheAge < CACHE_TTL) {
                cachedData[cacheKey] = cached.data;
                cachedTimestamps[cacheKey] = cached.timestamp;
              } else {
                // Remove expired cache
                sessionStorage.removeItem(key);
              }
            }
          } catch {
            // Invalid cache data, remove it
            sessionStorage.removeItem(key);
          }
        }
      });

      if (Object.keys(cachedData).length > 0) {
        setData(cachedData);
        setCacheTimestamps(cachedTimestamps);
      }
    }
  });

  return (
    <ChartDataContext.Provider value={{ data, loading, error, fetchChartData, clearCache }}>
      {children}
    </ChartDataContext.Provider>
  );
}

export function useChartData() {
  const context = useContext(ChartDataContext);
  if (context === undefined) {
    throw new Error('useChartData must be used within a ChartDataProvider');
  }
  return context;
}