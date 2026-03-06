'use client';

import { CRMLayout } from '@/components/crm-layout';
import { DashboardCharts } from '@/components/dashboard-charts';
import { StatCard } from '@/components/stat-card';
import { StatCardSkeleton } from '@/components/states/stat-card-skeleton';
import { DashboardEmpty } from '@/components/states/dashboard-empty';
import {
  Users, TrendingUp, DollarSign, Target, Settings,
  CalendarCheck, AlertTriangle, Zap, ChevronRight,
} from 'lucide-react';
import { useLeads } from '@/hooks/useLeads';
import { getLeadsStaleNoMovement, getHighValueNoRecentContact } from '@/lib/metrics';
import {
  computeDashboardStats,
  computePipelineStages,
  getFollowUpDueLeads,
  getNextBestActions,
} from '@/lib/metrics';
import type { Lead } from '@/lib/types';
import Link from 'next/link';
import { useState } from 'react';


const PRIORITY_COLORS: Record<string, string> = {
  high:   'bg-coral-100  text-coral-700  dark:bg-coral-900/40  dark:text-coral-300',
  medium: 'bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-300',
  low:    'bg-slate-100  text-slate-600  dark:bg-slate-700     dark:text-slate-400',
};

function daysSince(date: Date | string): number {
  const d = date instanceof Date ? date : new Date(date);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── FollowUpToday ────────────────────────────────────────────────────────────

function FollowUpToday({ due }: { due: Lead[] }) {
  const top3 = due.slice(0, 3);

  return (
    <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-coral-50 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4 text-coral-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">Follow up today</h2>
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              High-priority leads not contacted in 3+ days
            </p>
          </div>
        </div>
        <Link
          href="/leads?followUp=true"
          className="text-sm font-bold text-coral-600 hover:text-coral-700 hover:underline transition-colors"
        >
          View all →
        </Link>
      </div>

      {/* Lead rows */}
      {top3.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            No high-priority leads overdue right now. Great work.
          </p>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[minmax(0,1fr)_6rem_7rem_6rem] px-6 py-2 border-b border-[var(--border)] bg-[var(--border)]/10">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Lead</span>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Priority</span>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Deal Value</span>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Last Contact</span>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {top3.map((lead) => {
              const overdue = daysSince(lead.lastContact);
              return (
                <li key={lead.id}>
                  <Link
                    href={`/leads?lead=${lead.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_6rem_7rem_6rem] items-center gap-x-4 gap-y-1 px-6 py-4 hover:bg-slate-50 dark:hover:bg-[var(--border)]/20 transition-colors group"
                  >
                    {/* Name + contact */}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-coral-600 transition-colors">
                        {lead.companyName}
                      </p>
                      <p className="text-xs font-medium text-[var(--text-secondary)] truncate">
                        {lead.contactName} · {lead.owner}
                      </p>
                    </div>

                    {/* Priority pill */}
                    <div className="hidden md:flex">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${PRIORITY_COLORS[lead.priority] ?? ''}`}>
                        {lead.priority}
                      </span>
                    </div>

                    {/* Deal value */}
                    <div className="hidden md:block">
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        ${(lead.value / 1000).toFixed(0)}k
                      </p>
                    </div>

                    {/* Last contacted — plain muted text */}
                    <div className="hidden md:flex items-center">
                      <span className="text-xs text-slate-500 font-medium">{overdue}d ago</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {due.length > 3 && (
        <div className="px-6 py-3 border-t border-[var(--border)] bg-slate-50 dark:bg-slate-800">
          <Link
            href="/leads?followUp=true"
            className="flex items-center gap-1 text-xs font-bold text-coral-600 dark:text-coral-400 hover:underline"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            {due.length - 3} more lead{due.length - 3 !== 1 ? 's' : ''} need follow-up
          </Link>
        </div>
      )}
    </section>
  );
}

// ─── NextBestActions ──────────────────────────────────────────────────────────

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

function NextBestActions({ leads }: { leads: Lead[] }) {
  const actions = getNextBestActions(leads, 5);

  // Primary: priority (high → medium → low). Secondary: deal value (highest first).
  const sorted = [...actions].sort((a, b) => {
    const pd = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
    if (pd !== 0) return pd;
    return b.value - a.value;
  });

  return (
    <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <Zap className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">Next best actions</h2>
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              Top 5 leads ranked by priority + recency
            </p>
          </div>
        </div>
        <Link
          href="/leads"
          className="text-sm font-bold text-coral-600 hover:text-coral-700 hover:underline transition-colors"
        >
          View all leads →
        </Link>
      </div>

      {/* Lead rows */}
      {sorted.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm font-medium text-[var(--text-secondary)]">No active leads to prioritise.</p>
        </div>
      ) : (
        <>
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[2rem_minmax(0,1fr)_5rem_5.5rem_6rem] px-6 py-2 border-b border-[var(--border)] bg-[var(--border)]/10">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">#</span>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Lead</span>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Priority</span>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Deal Value</span>
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Last Contact</span>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {sorted.map((lead, i) => {
              const overdue = daysSince(lead.lastContact);
              return (
                <li key={lead.id}>
                  <Link
                    href={`/leads?lead=${lead.id}`}
                    className="grid grid-cols-[2rem_minmax(0,1fr)_auto] md:grid-cols-[2rem_minmax(0,1fr)_5rem_5.5rem_6rem] items-center gap-x-4 gap-y-1 px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-[var(--border)]/20 transition-colors group"
                  >
                    {/* Rank */}
                    <span className="text-xs font-bold text-slate-400 tabular-nums">#{i + 1}</span>

                    {/* Name + owner */}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate group-hover:text-coral-600 transition-colors">
                        {lead.companyName}
                      </p>
                      <p className="text-xs font-medium text-[var(--text-secondary)] truncate">
                        {lead.contactName} · {lead.owner}
                      </p>
                    </div>

                    {/* Priority — no border */}
                    <div className="hidden md:flex">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${PRIORITY_COLORS[lead.priority] ?? ''}`}>
                        {lead.priority}
                      </span>
                    </div>

                    {/* Deal value */}
                    <div className="hidden md:block">
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        ${(lead.value / 1000).toFixed(0)}k
                      </p>
                    </div>

                    {/* Last contact */}
                    <div className="hidden md:flex items-center">
                      <span className="text-xs text-slate-500 font-medium">{overdue}d ago</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

type ViewState = 'normal' | 'loading' | 'empty';

export default function DashboardPage() {
  const [viewState, setViewState] = useState<ViewState>('normal');
  const { leads: storedLeads } = useLeads();
  const leads = viewState === 'empty' ? [] : storedLeads;

  const stats = computeDashboardStats(leads);
  const { totalLeads, newLeads, qualifiedLeads, proposalStage, wonDeals, totalValue, avgDealSize, conversionRate } = stats;

  const staleLeads = getLeadsStaleNoMovement(leads);
  const highValueNoContact = getHighValueNoRecentContact(leads);

  const pipelineStages = computePipelineStages(leads);

  // Compute follow-up leads once here so we can exclude them from Next best actions.
  // Both sections should never surface the same lead simultaneously.
  const followUpLeads = getFollowUpDueLeads(leads);
  const followUpIds = new Set(followUpLeads.map((l) => l.id));
  const leadsForNextActions = leads.filter((l) => !followUpIds.has(l.id));

  return (
    <CRMLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)] font-medium">
              Overview of your sales pipeline and performance
            </p>
          </div>
        </div>

        {viewState === 'empty' ? (
          <DashboardEmpty />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {viewState === 'loading' ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard
                    title="Total Leads"
                    value={totalLeads}
                    subtitle={`${newLeads} new this week`}
                    icon={Users}
                  />
                  <StatCard
                    title="Qualified Leads"
                    value={qualifiedLeads}
                    subtitle={`${proposalStage} in proposal`}
                    icon={Target}
                  />
                  <StatCard
                    title="Pipeline Value"
                    value={`$${(totalValue / 1000).toFixed(0)}k`}
                    subtitle={`Avg: $${(avgDealSize / 1000).toFixed(0)}k per deal`}
                    icon={DollarSign}
                  />
                  <StatCard
                    title="Conversion Rate"
                    value={`${conversionRate.toFixed(1)}%`}
                    subtitle={`${wonDeals} deals closed`}
                    icon={TrendingUp}
                  />
                </>
              )}
            </div>

            {/* Follow Up Today + Next Best Actions — equal-width columns side by side */}
            {viewState === 'loading' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {[0, 1].map((s) => (
                  <div key={s} className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm">
                    <div className="px-6 py-4 border-b border-[var(--border)]">
                      <div className="h-5 w-40 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="px-6 py-4 animate-pulse flex items-center gap-4">
                          <div className="h-4 w-4 bg-slate-200 rounded-full flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3.5 w-44 bg-slate-200 rounded" />
                            <div className="h-3 w-32 bg-slate-100 rounded" />
                          </div>
                          <div className="hidden md:block h-5 w-14 bg-slate-100 rounded-full" />
                          <div className="hidden md:block h-5 w-10 bg-slate-200 rounded" />
                          <div className="hidden md:block h-5 w-20 bg-slate-100 rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <FollowUpToday due={followUpLeads} />
                <NextBestActions leads={leadsForNextActions} />
              </div>
            )}

            {/* Pipeline risk */}
            {viewState !== 'loading' && (
              <div className="mb-8 rounded-lg border border-amber-200 dark:border-amber-800/50 border-l-4 border-l-amber-400 bg-amber-50 dark:bg-amber-950/30 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h2 className="text-lg font-bold text-[var(--text-primary)] dark:text-amber-200">Pipeline risk</h2>
                </div>
                <div className="divide-y divide-amber-200 dark:divide-amber-800/50">
                  <Link
                    href="/leads?filter=stale"
                    className="flex items-center justify-between px-6 py-4 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <span className="text-sm text-[var(--text-primary)] dark:text-amber-200 font-medium">
                      {staleLeads.length} deal{staleLeads.length !== 1 ? 's' : ''} have not moved in 14 days
                    </span>
                    <span className="text-sm font-bold text-coral-600 hover:underline">View list →</span>
                  </Link>
                  <Link
                    href="/leads?filter=high-value-no-contact"
                    className="flex items-center justify-between px-6 py-4 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-colors"
                  >
                    <span className="text-sm text-[var(--text-primary)] dark:text-amber-200 font-medium">
                      {highValueNoContact.length} high-value lead{highValueNoContact.length !== 1 ? 's' : ''} have no recent contact
                    </span>
                    <span className="text-sm font-bold text-coral-600 hover:underline">View list →</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Charts — client-only to avoid Recharts SSR issues */}
            <DashboardCharts pipelineStages={pipelineStages} />
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
          <div className="absolute right-0 bottom-full mb-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover/demo:opacity-100 group-hover/demo:visible transition-all">
            <div className="p-1">
              <button
                onClick={() => setViewState('normal')}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded transition-colors ${
                  viewState === 'normal' ? 'bg-coral-50 text-coral-900 dark:bg-coral-900/30 dark:text-coral-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setViewState('loading')}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded transition-colors ${
                  viewState === 'loading' ? 'bg-coral-50 text-coral-900 dark:bg-coral-900/30 dark:text-coral-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                Loading
              </button>
              <button
                onClick={() => setViewState('empty')}
                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded transition-colors ${
                  viewState === 'empty' ? 'bg-coral-50 text-coral-900 dark:bg-coral-900/30 dark:text-coral-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                Empty
              </button>
            </div>
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}
