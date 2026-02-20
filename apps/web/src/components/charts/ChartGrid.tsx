'use client';

import { ReactNode } from 'react';

interface ChartGridProps {
  children: ReactNode;
}

export function ChartGrid({ children }: ChartGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {children}
    </div>
  );
}