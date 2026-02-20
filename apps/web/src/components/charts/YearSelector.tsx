'use client';

import { useEffect, useState } from 'react';

interface YearSelectorProps {
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export function YearSelector({ selectedYear, onYearChange }: YearSelectorProps) {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  const fetchAvailableYears = async () => {
    try {
      const response = await fetch('/api/charts/available-years');
      const data = await response.json();
      setAvailableYears(data.years || []);
    } catch (error) {
      console.error('Failed to fetch available years:', error);
      // Fallback to current year
      setAvailableYears([new Date().getFullYear()]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-32 h-10 bg-gray-100 animate-pulse rounded-md"></div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="year-selector" className="text-sm font-medium text-gray-700">
        Year:
      </label>
      <select
        id="year-selector"
        value={selectedYear}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      >
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}