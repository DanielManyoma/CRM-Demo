'use client';

import { CRMLayout } from '@/components/crm-layout';
import { DashboardCharts } from '@/components/dashboard-charts';
import { StatCard } from '@/components/stat-card';
import { StatCardSkeleton } from '@/components/states/stat-card-skeleton';
import { DashboardEmpty } from '@/components/states/dashboard-empty';
import {
  Users, TrendingUp, DollarSign, Target, Settings,
  CalendarCheck, AlertTriangle, Clock, Zap, ChevronRight,
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

// ─── Status badge config (matches VISUAL_STANCE.md color system) ─────────────

const STATUS_COLORS: Record<string, string> = {
  new:          'bg-slate-100  text-slate-800  border-slate-300',
  contacted:    'bg-amber-100  text-amber-900  border-amber-300',
  qualified:    'bg-cyan-100   text-cyan-900   border-cyan-400',
  proposal:     'bg-indigo-100 text-indigo-900 border-indigo-400',
  negotiation:  'bg-violet-100 text-violet-900 border-violet-400',
  'closed-won': 'bg-emerald-100 text-emerald-900 border-emerald-400',
  'closed-lost':'bg-rose-100   text-rose-900   border-rose-300',
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   'bg-coral-50  text-coral-700  border-coral-200',
  medium: 'bg-amber-50  text-amber-700  border-amber-200',
  low:    'bg-slate-100 text-slate-600  border-slate-200',
};

function daysSince(date: Date | string): number {
  const d = date instanceof Date ? date : new Date(date);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── FollowUpToday ────────────────────────────────────────────────────────────

function FollowUpToday({ leads }: { leads: Lead[] }) {
  const due = getFollowUpDueLeads(leads);
  const top3 = due.slice(0, 3);

  return (
    <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden mb-6">
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
        <div className="flex items-center gap-3">
          {due.length > 0 && (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-coral-600 text-white text-xs font-bold">
              {due.length}
            </span>
          )}
          <Link
            href="/leads?followUp=true"
            className="text-sm font-bold text-coral-600 hover:text-coral-700 hover:underline transition-colors"
          >
            View all →
          </Link>
        </div>
      </div>

      {/* Lead rows */}
      {top3.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            No high-priority leads overdue right now. Great work.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {top3.map((lead) => {
            const overdue = daysSince(lead.lastContact);
            return (
              <li key={lead.id}>
                <Link
                  href={`/leads?lead=${lead.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_6rem_7rem_7rem] items-center gap-x-4 gap-y-1 px-6 py-4 hover:bg-slate-50 dark:hover:bg-[var(--border)]/20 transition-colors group"
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

                  {/* Overdue badge */}
                  <div className="hidden md:flex justify-end">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-coral-50 text-coral-700 border border-coral-200">
                      <Clock className="w-3 h-3" />
                      {overdue}d ago
                    </span>
                  </div>

                  {/* Deal value */}
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      ${(lead.value / 1000).toFixed(0)}k
                    </p>
                  </div>

                  {/* Status badge */}
                  <div className="hidden md:flex justify-end">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[lead.status] ?? ''}`}>
                      {lead.status.replace('-', ' ')}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {due.length > 3 && (
        <div className="px-6 py-3 border-t border-[var(--border)] bg-slate-50 dark:bg-[var(--border)]/10">
          <Link
            href="/leads?followUp=true"
            className="flex items-center gap-1 text-xs font-bold text-coral-600 hover:underline"
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

function NextBestActions({ leads }: { leads: Lead[] }) {
  const actions = getNextBestActions(leads, 5);

  return (
    <section className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
            <Zap className="w-4 h-4 text-slate-600" />
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
      {actions.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm font-medium text-[var(--text-secondary)]">No active leads to prioritise.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {actions.map((lead, i) => {
            const overdue = daysSince(lead.lastContact);
            return (
              <li key={lead.id}>
                <Link
                  href={`/leads?lead=${lead.id}`}
                  className="grid grid-cols-[2rem_minmax(0,1fr)_auto] md:grid-cols-[2rem_minmax(0,1fr)_6rem_5.5rem_7rem] items-center gap-x-4 gap-y-1 px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-[var(--border)]/20 transition-colors group"
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

                  {/* Priority */}
                  <div className="hidden md:flex justify-end">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${PRIORITY_COLORS[lead.priority] ?? ''}`}>
                      {lead.priority}
                    </span>
                  </div>

                  {/* Value */}
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      ${(lead.value / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs text-slate-400 font-medium">{overdue}d ago</p>
                  </div>

                  {/* Status */}
                  <div className="hidden md:flex justify-end">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_COLORS[lead.status] ?? ''}`}>
                      {lead.status.replace('-', ' ')}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type ViewState = 'normal' | 'loading' | 'empty';

export default function DashboardPage() {
  const [viewState, setViewState] = useState<ViewState>('normal');
  const { leads: storedLeads } = useLeads();
  const leads = viewState === 'empty' ? [] : storedLeads;

  // Stat card count — same function used by FollowUpToday section below
  const followUpCount = getFollowUpDueLeads(leads).length;

  const stats = computeDashboardStats(leads);
  const { totalLeads, newLeads, qualifiedLeads, proposalStage, wonDeals, totalValue, avgDealSize, conversionRate } = stats;

  const staleLeads = getLeadsStaleNoMovement(leads);
  const highValueNoContact = getHighValueNoRecentContact(leads);

  const pipelineStages = computePipelineStages(leads);

  return (
    <CRMLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)] font-medium">
                Overview of your sales pipeline and performance
              </p>
            </div>
            
            {/* State switcher for demo */}
            <div className="relative group">
              <button className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-all">
                <Settings className="w-3.5 h-3.5 mr-1.5" />
                Demo States
              </button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="p-1">
                  <button
                    onClick={() => setViewState('normal')}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded transition-colors ${
                      viewState === 'normal' ? 'bg-coral-50 text-coral-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setViewState('loading')}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded transition-colors ${
                      viewState === 'loading' ? 'bg-coral-50 text-coral-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Loading
                  </button>
                  <button
                    onClick={() => setViewState('empty')}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded transition-colors ${
                      viewState === 'empty' ? 'bg-coral-50 text-coral-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Empty
                  </button>
                </div>
              </div>
            </div>
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
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <Link href="/leads?followUp=true" className="block cursor-pointer">
                    <StatCard
                      title="Follow Up Today"
                      value={followUpCount}
                      subtitle="need contact"
                      icon={CalendarCheck}
                    />
                  </Link>
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
                    trend={{ value: '12% vs last week', positive: true }}
                  />
                  <StatCard
                    title="Pipeline Value"
                    value={`$${(totalValue / 1000).toFixed(0)}k`}
                    subtitle={`Avg: $${(avgDealSize / 1000).toFixed(0)}k per deal`}
                    icon={DollarSign}
                    trend={{ value: '8% vs last month', positive: true }}
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

            {/* Pipeline risk */}
            {viewState !== 'loading' && (
              <div className="mb-8 bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm">
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Pipeline risk</h2>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  <Link
                    href="/leads?risk=stale"
                    className="flex items-center justify-between px-6 py-4 hover:bg-[var(--border)]/30 transition-colors"
                  >
                    <span className="text-sm text-[var(--text-primary)] font-medium">
                      {staleLeads.length} deal{staleLeads.length !== 1 ? 's' : ''} have not moved in 14 days
                    </span>
                    <span className="text-sm font-bold text-coral-600 hover:underline">View list →</span>
                  </Link>
                  <Link
                    href="/leads?risk=highValue"
                    className="flex items-center justify-between px-6 py-4 hover:bg-[var(--border)]/30 transition-colors"
                  >
                    <span className="text-sm text-[var(--text-primary)] font-medium">
                      {highValueNoContact.length} high-value lead{highValueNoContact.length !== 1 ? 's' : ''} have no recent contact
                    </span>
                    <span className="text-sm font-bold text-coral-600 hover:underline">View list →</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Charts — client-only to avoid Recharts SSR issues */}
            <DashboardCharts pipelineStages={pipelineStages} />

            {/* Decision-support sections: Follow Up Today + Next Best Actions */}
            {viewState === 'loading' ? (
              /* Skeleton for both decision sections */
              <div className="space-y-6">
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
              <div className="space-y-6">
                <FollowUpToday leads={leads} />
                <NextBestActions leads={leads} />
              </div>
            )}
          </>
        )}
      </div>
    </CRMLayout>
  );
}
