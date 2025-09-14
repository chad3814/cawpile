export function PieChartSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="relative">
        <div className="w-40 h-40 rounded-full bg-gray-200 animate-pulse" />
        <div className="absolute inset-4 rounded-full bg-white" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border-8 border-gray-300 border-t-gray-400 animate-spin" />
        </div>
      </div>
    </div>
  );
}