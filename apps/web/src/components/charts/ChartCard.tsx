'use client';

import { ReactNode } from 'react';

interface ChartCardProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ id, title, children, className = '' }: ChartCardProps) {
  return (
    <div
      id={id}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-[300px]">
        {children}
      </div>
    </div>
  );
}