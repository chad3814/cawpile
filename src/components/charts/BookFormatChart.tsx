'use client';

import { useEffect, useState } from 'react';
import { BasePieChart } from './BasePieChart';
import { PieChartSkeleton } from './skeletons';
import { CHART_COLORS } from '@/lib/charts';
import { formatBookCount } from '@/lib/charts/formatters';

interface BookFormatChartProps {
  year: number;
}

export function BookFormatChart({ year }: BookFormatChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/charts/book-format?year=${year}`);

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PieChartSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        {error}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No books completed this year
      </div>
    );
  }

  const formatColors = [
    CHART_COLORS.hardcover,
    CHART_COLORS.paperback,
    CHART_COLORS.ebook,
    CHART_COLORS.audiobookFormat
  ];

  return (
    <BasePieChart
      data={data}
      dataKey="value"
      nameKey="name"
      colors={formatColors}
      tooltipFormatter={(value) => formatBookCount(value)}
    />
  );
}