'use client';

import { CRMLayout } from '@/components/crm-layout';
import { DashboardCharts } from '@/components/dashboard-charts';
import { StatCard } from '@/components/stat-card';
import { StatCardSkeleton } from '@/components/states/stat-card-skeleton';
import { DashboardEmpty } from '@/components/states/dashboard-empty';
import { Users, TrendingUp, DollarSign, Target, CheckCircle, Clock, Settings, CalendarCheck, AlertTriangle } from 'lucide-react';
import { useLeads } from '@/components/leads-provider';
import {
  getLeadsNeedingFollowUp,
  sortLeadsByPriority,
  getLeadsStaleNoMovement,
  getHighValueNoRecentContact,
} from '@/lib/prioritization';
import { computeDashboardStats, computePipelineStages } from '@/lib/metrics';
import Link from 'next/link';
import { useState } from 'react';

type ViewState = 'normal' | 'loading' | 'empty';

export default function DashboardPage() {
  const [viewState, setViewState] = useState<ViewState>('normal');
  const { leads: storedLeads } = useLeads();
  const leads = viewState === 'empty' ? [] : storedLeads;
  const followUpLeads = getLeadsNeedingFollowUp(leads);
  const followUpCount = followUpLeads.length;

  const stats = computeDashboardStats(leads);
  const { totalLeads, newLeads, qualifiedLeads, proposalStage, wonDeals, totalValue, avgDealSize, conversionRate } = stats;

  const activeLeads = leads.filter((l) => l.status !== 'closed-won' && l.status !== 'closed-lost');
  const nextBestActions = sortLeadsByPriority(activeLeads).slice(0, 5);

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

            {/* Next best actions */}
            {viewState === 'loading' ? (
              <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm">
                <div className="px-6 py-4 border-b border-[var(--border)]">
                  <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="px-6 py-4 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-5 h-5 bg-slate-100 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <div className="h-3.5 w-40 bg-slate-200 rounded" />
                            <div className="h-3 w-32 bg-slate-100 rounded" />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="space-y-2">
                            <div className="h-3.5 w-16 bg-slate-200 rounded" />
                            <div className="h-2.5 w-20 bg-slate-100 rounded" />
                          </div>
                          <div className="h-6 w-20 bg-slate-100 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] shadow-sm">
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Next best actions</h2>
              <Link
                href="/leads?followUp=true"
                className="text-sm font-bold text-coral-600 hover:text-coral-700 hover:underline transition-colors"
              >
                View follow-up list →
              </Link>
            </div>
          </div>
          {/* Column-based layout: same grid template for every row */}
          <div className="divide-y divide-[var(--border)]">
            {nextBestActions.map((lead) => (
              <div
                key={lead.id}
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_5rem_6.5rem_6.5rem] items-center gap-x-6 gap-y-1 px-6 py-4 hover:bg-[var(--border)]/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    {lead.status === 'closed-won' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">
                          {lead.companyName}
                        </p>
                    <p className="text-sm text-[var(--text-secondary)] font-medium truncate">{lead.contactName}</p>
                  </div>
                </div>
                <div className="text-right text-sm font-bold text-[var(--text-primary)]">
                  ${(lead.value / 1000).toFixed(0)}k
                </div>
                <div className="text-right text-xs font-medium text-[var(--text-secondary)]">
                  {new Date(lead.lastContact).toLocaleDateString()}
                </div>
                <div className="flex justify-end">
                  <span
                    className={`
                      inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap
                      ${lead.status === 'closed-won' && 'bg-emerald-100 text-emerald-900 border-emerald-400'}
                      ${lead.status === 'negotiation' && 'bg-violet-100 text-violet-900 border-violet-400'}
                      ${lead.status === 'proposal' && 'bg-indigo-100 text-indigo-900 border-indigo-400'}
                      ${lead.status === 'qualified' && 'bg-cyan-100 text-cyan-900 border-cyan-400'}
                      ${lead.status === 'contacted' && 'bg-amber-100 text-amber-900 border-amber-300'}
                      ${lead.status === 'new' && 'bg-slate-100 text-slate-800 border-slate-300'}
                    `}
                  >
                    {lead.status.replace('-', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
            )}
          </>
        )}
      </div>
    </CRMLayout>
  );
}
