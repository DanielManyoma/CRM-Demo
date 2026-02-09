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
    <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-4">
        <div className="w-12 h-12 bg-coral-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-coral-600" />
        </div>
        <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-slate-950">{value}</p>
        {subtitle && (
          <p className="text-sm text-slate-600 font-medium">{subtitle}</p>
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
