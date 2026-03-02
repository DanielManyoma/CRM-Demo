export function TableSkeleton() {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--border)]/30 border-b border-[var(--border)]">
              <th className="px-6 py-3.5 text-left">
                <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
              </th>
              <th className="px-6 py-3.5 text-left">
                <div className="h-3 w-16 bg-slate-200 rounded animate-pulse" />
              </th>
              <th className="px-6 py-3.5 text-right">
                <div className="h-3 w-20 bg-slate-200 rounded animate-pulse ml-auto" />
              </th>
              <th className="px-6 py-3.5 text-left">
                <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
              </th>
              <th className="px-6 py-3.5 w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {[...Array(8)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-slate-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-40 bg-slate-200 rounded" />
                      <div className="h-3 w-32 bg-slate-100 rounded" />
                      <div className="h-2.5 w-24 bg-slate-100 rounded" />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="h-6 w-20 bg-slate-100 rounded-full" />
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2 flex flex-col items-end">
                    <div className="h-3.5 w-24 bg-slate-200 rounded" />
                    <div className="h-2.5 w-16 bg-slate-100 rounded" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    <div className="h-3.5 w-20 bg-slate-200 rounded" />
                    <div className="h-2.5 w-24 bg-slate-100 rounded" />
                  </div>
                </td>
                <td className="px-6 py-4" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
