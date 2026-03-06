import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export function StatCard({ title, value, subtitle, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm hover:shadow-md transition-shadow min-h-[180px]">
      <div className="flex flex-col gap-4">
        <div className="w-12 h-12 bg-[var(--accent-muted)] rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-[var(--accent)]" />
        </div>
        <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
        {subtitle && (
          <p className="text-sm text-[var(--text-secondary)] font-medium">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-sm font-bold ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
