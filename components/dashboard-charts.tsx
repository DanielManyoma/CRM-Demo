'use client';

import { useState, useEffect } from 'react';
import { useTheme } from './theme-provider';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const LEADS_OVER_TIME = [
  { date: 'Jan 17', leads: 2 },
  { date: 'Jan 18', leads: 1 },
  { date: 'Jan 19', leads: 3 },
  { date: 'Jan 20', leads: 2 },
  { date: 'Jan 21', leads: 4 },
  { date: 'Jan 22', leads: 1 },
  { date: 'Jan 23', leads: 2 },
  { date: 'Jan 24', leads: 3 },
  { date: 'Jan 25', leads: 1 },
  { date: 'Jan 26', leads: 2 },
  { date: 'Jan 27', leads: 2 },
  { date: 'Jan 28', leads: 3 },
  { date: 'Jan 29', leads: 2 },
  { date: 'Jan 30', leads: 4 },
];

type PipelineStageRow = { stage: string; value: number };

interface DashboardChartsProps {
  pipelineStages: PipelineStageRow[];
}

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm p-6 h-[340px] animate-pulse">
        <div className="h-5 w-40 bg-[var(--border)] rounded mb-4" />
        <div className="h-[260px] bg-[var(--border)]/30 rounded" />
      </div>
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm p-6 h-[340px] animate-pulse">
        <div className="h-5 w-48 bg-[var(--border)] rounded mb-4" />
        <div className="h-[260px] bg-[var(--border)]/30 rounded" />
      </div>
    </div>
  );
}

export function DashboardCharts({ pipelineStages }: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ChartsSkeleton />;
  }

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm p-6">
        <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Pipeline value by stage</h2>
        <div className="w-full h-[260px] min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineStages} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: axisColor }} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Bar dataKey="value" fill="#36747B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm p-6">
        <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Leads over time (last 14 days)</h2>
        <div className="w-full h-[260px] min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={LEADS_OVER_TIME} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: axisColor }} />
              <YAxis tick={{ fontSize: 11, fill: axisColor }} allowDecimals={false} />
              <Line type="monotone" dataKey="leads" stroke="#36747B" strokeWidth={2} dot={{ fill: '#36747B' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
