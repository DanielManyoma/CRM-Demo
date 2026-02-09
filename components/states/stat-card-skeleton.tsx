export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0" />
        <div className="h-3 w-24 bg-slate-200 rounded" />
        <div className="h-8 w-16 bg-slate-200 rounded" />
        <div className="h-3 w-32 bg-slate-100 rounded" />
      </div>
    </div>
  );
}
