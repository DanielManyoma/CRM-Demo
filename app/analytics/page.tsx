'use client';

import { useState, useEffect, useMemo } from 'react';
import { CRMLayout } from '@/components/crm-layout';
import { useLeads } from '@/hooks/useLeads';
import { computeDashboardStats } from '@/lib/metrics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

/** Mock weekly trend: current week = real stats, prior weeks = slight variation for demo. */
function buildTrendData(
  currentConversion: number,
  currentPipelineValue: number,
  weeks = 6
): { week: string; conversion: number; pipelineValue: number }[] {
  const now = new Date();
  const data: { week: string; conversion: number; pipelineValue: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const weekLabel = `W${d.getMonth() + 1}/${d.getDate()}`;
    const isCurrent = i === 0;
    data.push({
      week: weekLabel,
      conversion: isCurrent ? currentConversion : Math.max(0, currentConversion - (weeks - 1 - i) * 2 + Math.random() * 4),
      pipelineValue: isCurrent ? currentPipelineValue : Math.round(currentPipelineValue * (0.7 + (i / weeks) * 0.3 + (Math.random() - 0.5) * 0.1)),
    });
  }
  return data;
}

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { leads } = useLeads();
  const stats = useMemo(() => computeDashboardStats(leads), [leads]);
  const trendData = useMemo(
    () => buildTrendData(stats.conversionRate, stats.totalValue, 6),
    [stats.conversionRate, stats.totalValue]
  );

  if (!mounted) {
    return (
      <CRMLayout>
        <div className="p-8">
          <div className="mb-8">
            <div className="h-8 w-48 bg-[var(--border)] rounded animate-pulse" />
            <div className="h-4 w-64 mt-2 bg-[var(--border)]/50 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[320px] bg-[var(--surface)] rounded-lg border border-[var(--border)] animate-pulse" />
            <div className="h-[320px] bg-[var(--surface)] rounded-lg border border-[var(--border)] animate-pulse" />
          </div>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)] font-medium">
            Conversion and pipeline trends
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm p-6">
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Conversion over time</h2>
            <div className="w-full h-[260px] min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                  <Line
                    type="monotone"
                    dataKey="conversion"
                    stroke="#f97066"
                    strokeWidth={2}
                    dot={{ fill: '#f97066' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm p-6">
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-4">Pipeline value over time</h2>
            <div className="w-full h-[260px] min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Line
                    type="monotone"
                    dataKey="pipelineValue"
                    stroke="#f97066"
                    strokeWidth={2}
                    dot={{ fill: '#f97066' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">Current snapshot</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Conversion: {stats.conversionRate.toFixed(1)}% · Pipeline value: $
            {(stats.totalValue / 1000).toFixed(0)}k · {stats.wonDeals} deals closed
          </p>
        </div>
      </div>
    </CRMLayout>
  );
}
