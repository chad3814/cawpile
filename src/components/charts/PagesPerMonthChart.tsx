'use client';

import { useEffect, useState } from 'react';
import { BaseBarChart } from './BaseBarChart';
import { BarChartSkeleton } from './skeletons';
import { formatPageCount } from '@/lib/charts/formatters';
import { CHART_COLORS } from '@/lib/charts';

interface PagesPerMonthChartProps {
  year: number;
}

interface ChartData {
  month: string;
  value: number;
}

export function PagesPerMonthChart({ year }: PagesPerMonthChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/charts/pages-per-month?year=${year}`);

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
    return <BarChartSkeleton />;
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
        No pages recorded this year
      </div>
    );
  }

  return (
    <BaseBarChart
      data={data}
      dataKey="value"
      xAxisKey="month"
      color={CHART_COLORS.pages}
      tooltipFormatter={(value) => formatPageCount(value)}
    />
  );
}
