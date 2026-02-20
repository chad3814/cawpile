"use client";

import { BaseBarChart } from "@/components/charts/BaseBarChart";
import { BasePieChart } from "@/components/charts/BasePieChart";
import {
  DEMO_BOOKS_PER_MONTH,
  DEMO_PAGES_PER_MONTH,
  DEMO_BOOK_FORMAT,
  CHART_COLORS,
} from "@/lib/charts";
import { formatBookCount, formatPageCount } from "@/lib/charts/formatters";

export default function HomepageCharts() {
  const booksStackedKeys = [
    { key: "completed", color: CHART_COLORS.books, label: "Completed" },
    { key: "dnf", color: CHART_COLORS.dnf, label: "DNF" },
  ];

  return (
    <div className="w-full">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Books per Month Chart */}
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-sm font-medium text-foreground mb-4 text-center">
            Books per Month
          </h3>
          <div className="h-[200px]">
            <BaseBarChart
              data={DEMO_BOOKS_PER_MONTH}
              xAxisKey="month"
              stackedKeys={booksStackedKeys}
              tooltipFormatter={(value) => formatBookCount(value)}
              showLegend
            />
          </div>
        </div>

        {/* Book Format Chart */}
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-sm font-medium text-foreground mb-4 text-center">
            Book Format
          </h3>
          <div className="h-[200px]">
            <BasePieChart
              data={DEMO_BOOK_FORMAT}
              dataKey="value"
              nameKey="name"
              colors={CHART_COLORS.categorical}
              tooltipFormatter={(value, name) => `${name}: ${formatBookCount(value)}`}
              innerRadius={30}
              outerRadius={60}
            />
          </div>
        </div>

        {/* Pages per Month Chart */}
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-sm font-medium text-foreground mb-4 text-center">
            Pages per Month
          </h3>
          <div className="h-[200px]">
            <BaseBarChart
              data={DEMO_PAGES_PER_MONTH}
              dataKey="pages"
              xAxisKey="month"
              color={CHART_COLORS.pages}
              tooltipFormatter={(value) => formatPageCount(value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
