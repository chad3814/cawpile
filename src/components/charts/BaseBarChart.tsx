'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { CHART_COLORS, CHART_CONFIG } from '@/lib/charts';

interface BaseBarChartProps<T = any> {
  data: T[];
  dataKey: string;
  xAxisKey: string;
  color?: string;
  tooltipFormatter?: (value: any) => string;
  xAxisFormatter?: (value: any) => string;
  yAxisFormatter?: (value: any) => string;
}

export function BaseBarChart<T = any>({
  data,
  dataKey,
  xAxisKey,
  color = CHART_COLORS.primary,
  tooltipFormatter,
  xAxisFormatter,
  yAxisFormatter
}: BaseBarChartProps<T>) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className="text-gray-600">
            {tooltipFormatter ? tooltipFormatter(payload[0].value) : payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={CHART_CONFIG.margins}>
        <CartesianGrid
          strokeDasharray={CHART_CONFIG.grid.strokeDasharray}
          stroke={CHART_CONFIG.grid.stroke}
        />
        <XAxis
          dataKey={xAxisKey}
          tick={CHART_CONFIG.axis.tick}
          tickFormatter={xAxisFormatter}
        />
        <YAxis
          tick={CHART_CONFIG.axis.tick}
          tickFormatter={yAxisFormatter}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey={dataKey}
          fill={color}
          animationDuration={CHART_CONFIG.barChart.animationDuration}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}