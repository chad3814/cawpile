'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS, CHART_CONFIG } from '@/lib/charts';

const data = [
  { month: 'Jan', books: 4 },
  { month: 'Feb', books: 7 },
  { month: 'Mar', books: 5 },
  { month: 'Apr', books: 8 },
];

export function TestChart() {
  return (
    <div className="w-full h-[300px] p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Test Chart - Books per Month</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_CONFIG.margins}>
          <CartesianGrid strokeDasharray={CHART_CONFIG.grid.strokeDasharray} stroke={CHART_CONFIG.grid.stroke} />
          <XAxis dataKey="month" tick={CHART_CONFIG.axis.tick} />
          <YAxis tick={CHART_CONFIG.axis.tick} />
          <Tooltip contentStyle={CHART_CONFIG.tooltip.contentStyle} />
          <Bar dataKey="books" fill={CHART_COLORS.books} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}