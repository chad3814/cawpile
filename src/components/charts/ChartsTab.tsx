'use client';

import { useState } from 'react';
import { YearSelector } from './YearSelector';
import { ChartGrid } from './ChartGrid';
import { ChartCard } from './ChartCard';
import { TestChart } from './TestChart';

export function ChartsTab() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Reading Analytics</h2>
        <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
      </div>

      {/* Charts Grid */}
      <ChartGrid>
        <ChartCard id="test-chart" title="Test Chart">
          <TestChart />
        </ChartCard>

        <ChartCard id="placeholder-1" title="Books per Month">
          <div className="flex items-center justify-center h-full text-gray-400">
            Coming soon...
          </div>
        </ChartCard>

        <ChartCard id="placeholder-2" title="Pages per Month">
          <div className="flex items-center justify-center h-full text-gray-400">
            Coming soon...
          </div>
        </ChartCard>

        <ChartCard id="placeholder-3" title="DNF per Month">
          <div className="flex items-center justify-center h-full text-gray-400">
            Coming soon...
          </div>
        </ChartCard>
      </ChartGrid>
    </div>
  );
}