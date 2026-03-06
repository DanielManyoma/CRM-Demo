export function StatCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0" />
        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-600 rounded" />
        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-600 rounded" />
        <div className="h-3 w-32 bg-slate-100 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
}
