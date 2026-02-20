'use client';

import { useEffect, useState } from 'react';
import { BasePieChart } from './BasePieChart';
import { PieChartSkeleton } from './skeletons';
import { CHART_COLORS } from '@/lib/charts';
import { formatBookCount } from '@/lib/charts/formatters';

interface MainGenresChartProps {
  year: number;
}

interface ChartData {
  name: string;
  value: number;
}

export function MainGenresChart({ year }: MainGenresChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/charts/main-genres?year=${year}`);

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

    fetchData();
  }, [year]);

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
        No genre data available
      </div>
    );
  }

  return (
    <BasePieChart
      data={data}
      dataKey="value"
      nameKey="name"
      colors={CHART_COLORS.categorical}
      tooltipFormatter={(value) => formatBookCount(value)}
    />
  );
}
