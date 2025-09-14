export function BarChartSkeleton() {
  return (
    <div className="w-full h-full flex items-end justify-around p-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="w-12 bg-gray-200 rounded-t animate-pulse"
          style={{
            height: `${Math.random() * 60 + 20}%`,
            animationDelay: `${i * 100}ms`
          }}
        />
      ))}
    </div>
  );
}