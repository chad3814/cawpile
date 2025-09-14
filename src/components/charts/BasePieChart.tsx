'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  TooltipProps
} from 'recharts';
import { CHART_COLORS, CHART_CONFIG } from '@/lib/charts';

interface BasePieChartProps<T = any> {
  data: T[];
  dataKey: string;
  nameKey: string;
  colors?: readonly string[] | string[];
  tooltipFormatter?: (value: any, name: any) => string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

export function BasePieChart<T = any>({
  data,
  dataKey,
  nameKey,
  colors = CHART_COLORS.categorical as readonly string[],
  tooltipFormatter,
  showLegend = true,
  innerRadius = CHART_CONFIG.pieChart.innerRadius,
  outerRadius = CHART_CONFIG.pieChart.outerRadius
}: BasePieChartProps<T>) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-gray-600">
            {tooltipFormatter
              ? tooltipFormatter(data.value, data.name)
              : `${data.value} (${data.percent ? (data.percent * 100).toFixed(1) : 0}%)`
            }
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry: any) => {
    const percent = Number((entry.percent * 100).toFixed(0));
    return percent > 5 ? `${percent}%` : '';
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey={dataKey}
          animationDuration={CHART_CONFIG.pieChart.animationDuration}
          paddingAngle={CHART_CONFIG.pieChart.paddingAngle}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}