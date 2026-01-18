'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { CHART_COLORS, CHART_CONFIG } from '@/lib/charts';

interface StackedKey {
  key: string;
  color: string;
  label: string;
}

interface BaseBarChartProps<T = Record<string, unknown>> {
  data: T[];
  dataKey?: string;
  xAxisKey: string;
  color?: string;
  tooltipFormatter?: (value: number, label?: string) => string;
  xAxisFormatter?: (value: string) => string;
  yAxisFormatter?: (value: number) => string;
  stackedKeys?: StackedKey[];
  showLegend?: boolean;
}

export function BaseBarChart<T = Record<string, unknown>>({
  data,
  dataKey,
  xAxisKey,
  color = CHART_COLORS.primary,
  tooltipFormatter,
  xAxisFormatter,
  yAxisFormatter,
  stackedKeys,
  showLegend = false
}: BaseBarChartProps<T>) {
  const isStacked = stackedKeys && stackedKeys.length > 0;

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; dataKey: string; color: string }>;
    label?: string
  }) => {
    if (active && payload && payload.length) {
      if (isStacked) {
        // Calculate total for stacked bars
        const total = payload.reduce((sum, entry) => sum + entry.value, 0);
        return (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
            <p className="font-semibold text-gray-900">{label}</p>
            {payload.map((entry, index) => {
              const stackedKey = stackedKeys?.find(sk => sk.key === entry.dataKey);
              const displayLabel = stackedKey?.label || entry.name;
              return (
                <p key={index} className="text-gray-600" style={{ color: entry.color }}>
                  {displayLabel}: {tooltipFormatter ? tooltipFormatter(entry.value, displayLabel) : entry.value}
                </p>
              );
            })}
            <p className="text-gray-800 font-medium mt-1 pt-1 border-t border-gray-200">
              Total: {tooltipFormatter ? tooltipFormatter(total, 'Total') : total}
            </p>
          </div>
        );
      }
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
        {showLegend && (
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => {
              const stackedKey = stackedKeys?.find(sk => sk.key === value);
              return <span className="text-sm">{stackedKey?.label || value}</span>;
            }}
          />
        )}
        {isStacked ? (
          stackedKeys.map((sk) => (
            <Bar
              key={sk.key}
              dataKey={sk.key}
              stackId="stack"
              fill={sk.color}
              animationDuration={CHART_CONFIG.barChart.animationDuration}
            />
          ))
        ) : (
          <Bar
            dataKey={dataKey || 'value'}
            fill={color}
            animationDuration={CHART_CONFIG.barChart.animationDuration}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}