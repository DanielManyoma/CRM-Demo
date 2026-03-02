'use client';

import { CRMLayout } from '@/components/crm-layout';
import { useLeads } from '@/components/leads-provider';
import { computeDashboardStats, computePipelineStages } from '@/lib/metrics';
import { getAgentSummaries } from '@/lib/team-metrics';
import { expectedRevenueFromPipeline } from '@/lib/forecast';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function TeamPage() {
  const { leads } = useLeads();
  const teamStats = computeDashboardStats(leads);
  const pipelineStages = computePipelineStages(leads);
  const agents = getAgentSummaries(leads);
  const needsSupport = agents.filter((a) => a.needsSupport);
  const expectedRevenue = expectedRevenueFromPipeline(leads);

  return (
    <CRMLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Team</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)] font-medium">
            Pipeline health and per-agent performance
          </p>
        </div>

        {/* Team pipeline summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
            <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">Total leads</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{teamStats.totalLeads}</p>
            <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">{teamStats.qualifiedLeads} qualified</p>
          </div>
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
            <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">Pipeline value</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
              ${(teamStats.totalValue / 1000).toFixed(0)}k
            </p>
            <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">
              Avg ${(teamStats.avgDealSize / 1000).toFixed(0)}k per deal
            </p>
          </div>
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
            <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">Team conversion</p>
            <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
              {teamStats.conversionRate.toFixed(1)}%
            </p>
            <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">{teamStats.wonDeals} deals closed</p>
          </div>
        </div>

        {/* Expected revenue (lightweight forecast) */}
        <div className="mb-8 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
          <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">Expected revenue</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
            ${(expectedRevenue / 1000).toFixed(0)}k
          </p>
          <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">
            From current pipeline (stage-based close rates)
          </p>
        </div>

        {/* Needs support */}
        {needsSupport.length > 0 && (
          <div className="mb-8 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Agents needing support</h2>
            </div>
            <ul className="space-y-2">
              {needsSupport.map((a) => (
                <li key={a.ownerId} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--text-primary)]">{a.displayName}</span>
                  <span className="text-amber-800 dark:text-amber-200">{a.supportReason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Per-agent tiles */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">By agent</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Link
              key={agent.ownerId}
              href={`/leads?owner=${agent.ownerId}`}
              className="block bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-bold text-[var(--text-primary)]">{agent.displayName}</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-0.5">{agent.leadCount} leads</p>
                </div>
                {agent.needsSupport && (
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                    Needs support
                  </span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[var(--text-secondary)] font-medium">Pipeline</p>
                  <p className="font-bold text-[var(--text-primary)]">${(agent.pipelineValue / 1000).toFixed(0)}k</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] font-medium">Conversion</p>
                  <p className="font-bold text-[var(--text-primary)]">{agent.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
              {agent.supportReason && (
                <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{agent.supportReason}</p>
              )}
            </Link>
          ))}
        </div>

        {/* Pipeline by stage (compact) */}
        <div className="mt-8 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Pipeline by stage</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {pipelineStages.map((s) => (
              <div key={s.stage}>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">{s.stage}</p>
                <p className="text-lg font-bold text-[var(--text-primary)]">${(s.value / 1000).toFixed(0)}k</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}
