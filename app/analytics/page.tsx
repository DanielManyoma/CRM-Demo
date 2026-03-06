'use client';

import { useState, useEffect, useMemo } from 'react';
import { CRMLayout } from '@/components/crm-layout';
import { useLeads } from '@/hooks/useLeads';
import { computeDashboardStats } from '@/lib/metrics';
import type { Lead } from '@/lib/types';
import { StatCard } from '@/components/stat-card';
import { StatCardSkeleton } from '@/components/states/stat-card-skeleton';
import { Settings, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

type ViewState = 'normal' | 'loading' | 'empty' | 'error';

export type WeekPoint = {
  week: string;
  /** Cumulative conversion rate (%) as of this week's end. */
  conversion: number;
  /** Cumulative pipeline value of all non-lost leads created on or before this week. */
  pipelineValue: number;
  /**
   * True when this point was filled with a synthetic ramp rather than real win data.
   * Used to render a disclosure note on the conversion chart.
   */
  isEstimated: boolean;
};

/**
 * Deterministic pseudo-random in [0, 1) given an integer seed.
 * Produces the same value on every render — no useState / useEffect required.
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Derives 8 weekly data points from real lead records in `leads`.
 *
 * Pipeline value (cumulative):
 *   For each week W, sum the `value` of every non-closed-lost lead whose
 *   `createdAt` falls on or before the end of week W.
 *
 * Conversion rate (cumulative):
 *   For each week W, divide the count of closed-won leads whose `lastContact`
 *   falls on or before W by the count of all leads created on or before W.
 *   `lastContact` is used as a proxy for close date because the Lead type has
 *   no dedicated `closedAt` field.
 *
 * Synthetic blend (conversion only):
 *   If the first closed-won deal appears mid-series (common when most deals are
 *   still open), weeks before that point would all be 0 % — an uninformative
 *   flat line. Those weeks are replaced with a gentle ramp from ~0 toward the
 *   current rate, computed deterministically so values are stable across renders.
 *   A disclosure note is shown in the UI when any blended point is present.
 */
function computeWeeklyData(leads: Lead[], weeks: number = 8): WeekPoint[] {
  const now = new Date();

  // Internal type carries wonCount so we can find the first-win index.
  type RawPoint = WeekPoint & { wonCount: number };
  const raw: RawPoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    weekEnd.setHours(23, 59, 59, 999);

    const label = weekEnd.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    const createdByWeek = leads.filter((l) => {
      const created =
        l.createdAt instanceof Date ? l.createdAt : new Date(l.createdAt);
      return created <= weekEnd;
    });

    const wonByWeek = createdByWeek.filter((l) => {
      if (l.status !== 'closed-won') return false;
      const last =
        l.lastContact instanceof Date ? l.lastContact : new Date(l.lastContact);
      return last <= weekEnd;
    });

    const pipelineValue = createdByWeek
      .filter((l) => l.status !== 'closed-lost')
      .reduce((sum, l) => sum + l.value, 0);

    const conversion =
      createdByWeek.length > 0
        ? (wonByWeek.length / createdByWeek.length) * 100
        : 0;

    raw.push({
      week: label,
      conversion: Math.round(conversion * 10) / 10,
      pipelineValue,
      isEstimated: false,
      wonCount: wonByWeek.length,
    });
  }

  // Synthetic blend — fill pre-win weeks so the conversion chart shows a
  // trend rather than a long flat-zero line followed by a sudden jump.
  const firstWonIdx = raw.findIndex((p) => p.wonCount > 0);
  const finalConversion = raw[raw.length - 1].conversion;

  if (firstWonIdx > 1 && finalConversion > 0) {
    for (let i = 0; i < firstWonIdx; i++) {
      // Linear ramp: starts near 0, reaches ~85 % of the final rate just
      // before the real data begins.
      const fraction = (i + 1) / (firstWonIdx + 1);
      // ±1.25 pp deterministic noise — same value every render for a given i.
      const noise = seededRandom(i) * 2.5 - 1.25;
      const blended = finalConversion * fraction * 0.85 + noise;
      raw[i].conversion = Math.max(0, Math.round(blended * 10) / 10);
      raw[i].isEstimated = true;
    }
  }

  return raw.map(({ week, conversion, pipelineValue, isEstimated }) => ({
    week,
    conversion,
    pipelineValue,
    isEstimated,
  }));
}

export default function AnalyticsPage() {
  const [viewState, setViewState] = useState<ViewState>('normal');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { leads: storedLeads } = useLeads();
  const leads = viewState === 'empty' ? [] : storedLeads;

  // Live stats — always reflect the current leads in localStorage.
  const stats = useMemo(() => computeDashboardStats(leads), [leads]);

  // Weekly chart data — derived from real lead records with synthetic fallback
  // for the conversion series when historical wins are sparse.
  const weeklyData = useMemo(() => computeWeeklyData(leads, 8), [leads]);

  const hasEstimatedConversion = weeklyData.some((p) => p.isEstimated);

  const showSkeleton = !mounted || viewState === 'loading';

  return (
    <CRMLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Analytics</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)] font-medium">
            Conversion and pipeline trends
          </p>
        </div>

        {viewState === 'error' ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="text-base font-bold text-rose-900">Failed to load analytics data</p>
            <p className="text-sm text-rose-700 mt-1">
              Please check your connection and try again.
            </p>
            <button
              onClick={() => setViewState('normal')}
              className="mt-4 px-4 py-2 text-sm font-semibold text-rose-700 border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : showSkeleton ? (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[320px] bg-[var(--surface)] rounded-lg border border-[var(--border)]" />
              <div className="h-[320px] bg-[var(--surface)] rounded-lg border border-[var(--border)]" />
            </div>
            <div className="h-[80px] bg-[var(--surface)] rounded-lg border border-[var(--border)]" />
          </div>
        ) : viewState === 'empty' ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
            <p className="text-base font-bold text-[var(--text-primary)]">No analytics data yet</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Add leads to your pipeline to start seeing trends.
            </p>
          </div>
        ) : (
          <>
            {/* Summary stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Conversion Rate"
                value={`${stats.conversionRate.toFixed(1)}%`}
                subtitle={`${stats.wonDeals} deals closed`}
                icon={TrendingUp}
              />
              <StatCard
                title="Pipeline Value"
                value={`$${(stats.totalValue / 1000).toFixed(0)}k`}
                subtitle={`Avg $${(stats.avgDealSize / 1000).toFixed(0)}k per deal`}
                icon={DollarSign}
              />
              <StatCard
                title="Deals Closed"
                value={stats.wonDeals}
                subtitle={`of ${stats.totalLeads} total leads`}
                icon={CheckCircle}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Conversion over time */}
              <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm p-6">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    Conversion over time
                  </h2>
                  {hasEstimatedConversion && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      Earlier weeks show estimated trend — live from your first closed deal onward.
                    </p>
                  )}
                </div>
                <div className="w-full h-[260px] min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={weeklyData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Line
                        type="monotone"
                        dataKey="conversion"
                        stroke="#36747B"
                        strokeWidth={2}
                        dot={{ fill: '#36747B' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pipeline value over time */}
              <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm p-6">
                <div className="mb-4">
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    Pipeline value over time
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Cumulative value of all active leads created each week.
                  </p>
                </div>
                <div className="w-full h-[260px] min-h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={weeklyData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Line
                        type="monotone"
                        dataKey="pipelineValue"
                        stroke="#36747B"
                        strokeWidth={2}
                        dot={{ fill: '#36747B' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Demo States button — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group/demo">
          <button
            aria-label="Demo states"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-800 text-white text-xs font-semibold shadow-lg hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2"
          >
            <Settings className="w-3.5 h-3.5" aria-hidden="true" />
            Demo states
          </button>
          <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover/demo:opacity-100 group-hover/demo:visible transition-all">
            <div className="p-1">
              {(
                [
                  { id: 'normal', label: 'Normal' },
                  { id: 'loading', label: 'Loading' },
                  { id: 'empty', label: 'Empty' },
                  { id: 'error', label: 'Error' },
                ] as { id: ViewState; label: string }[]
              ).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setViewState(id)}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded transition-colors ${
                    viewState === id
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}
