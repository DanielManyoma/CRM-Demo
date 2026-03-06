'use client';

import { useState, useEffect, useMemo } from 'react';
import { CRMLayout } from '@/components/crm-layout';
import { useLeads } from '@/hooks/useLeads';
import {
  computeDashboardStats,
  computePipelineStages,
  getLeadsNeedingFollowUp,
  STAGE_CLOSE_RATES,
  STAGE_CLOSE_RATE_DISPLAY_ORDER,
} from '@/lib/metrics';
import { getAgentSummaries } from '@/lib/team-metrics';
import { expectedRevenueFromPipeline } from '@/lib/forecast';
import { Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  ResponsiveContainer,
} from 'recharts';

type ViewState = 'normal' | 'loading' | 'empty' | 'error';

const TEAL = '#36747B';
const CORAL = '#FF5716';

export default function TeamPage() {
  const [viewState, setViewState] = useState<ViewState>('normal');
  const [mounted, setMounted] = useState(false);
  const [showRates, setShowRates] = useState(false);
  useEffect(() => setMounted(true), []);

  const { leads: storedLeads } = useLeads();
  const leads = viewState === 'empty' ? [] : storedLeads;

  const teamStats = computeDashboardStats(leads);
  const pipelineStages = computePipelineStages(leads);
  const agents = getAgentSummaries(leads);
  const expectedRevenue = expectedRevenueFromPipeline(leads);

  const sortedStages = useMemo(
    () => [...pipelineStages].sort((a, b) => b.value - a.value),
    [pipelineStages]
  );

  const sortedAgents = useMemo(
    () => [...agents].sort((a, b) => b.pipelineValue - a.pipelineValue),
    [agents]
  );

  const followUpCounts = useMemo(() => {
    const map: Record<string, number> = {};
    agents.forEach((agent) => {
      const agentLeads = leads.filter(
        (l) => (l.ownerId ?? 'agent-1') === agent.ownerId
      );
      map[agent.ownerId] = getLeadsNeedingFollowUp(agentLeads).length;
    });
    return map;
  }, [agents, leads]);

  const chartHeight = Math.max(sortedStages.length * 52, 200);

  return (
    <CRMLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Team</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)] font-medium">
            Pipeline health and per-agent performance
          </p>
        </div>

        {viewState === 'error' ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-8 text-center">
            <p className="text-base font-bold text-rose-900">Unable to load team data</p>
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
        ) : viewState === 'loading' ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-[var(--surface)] rounded-lg border border-[var(--border)]"
                />
              ))}
            </div>
            <div className="h-[260px] bg-[var(--surface)] rounded-lg border border-[var(--border)]" />
            <div className="h-[120px] bg-[var(--surface)] rounded-lg border border-[var(--border)]" />
            <div className="h-[220px] bg-[var(--surface)] rounded-lg border border-[var(--border)]" />
          </div>
        ) : (
          <>
            {/* Team pipeline summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
                <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                  Total leads
                </p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {teamStats.totalLeads}
                </p>
                <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">
                  {teamStats.qualifiedLeads} qualified
                </p>
              </div>
              <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
                <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                  Pipeline value
                </p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  ${(teamStats.totalValue / 1000).toFixed(0)}k
                </p>
                <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">
                  Avg ${(teamStats.avgDealSize / 1000).toFixed(0)}k per deal
                </p>
              </div>
              <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
                <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                  Team conversion
                </p>
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {teamStats.conversionRate.toFixed(1)}%
                </p>
                <p className="text-sm text-[var(--text-secondary)] font-medium mt-1">
                  {teamStats.wonDeals} deals closed
                </p>
              </div>
            </div>

            {/* Pipeline by stage — horizontal bar chart */}
            <div className="mb-8 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6 shadow-sm">
              <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-5">
                Pipeline by stage
              </p>
              {!mounted ? (
                <div className="h-[240px] bg-[var(--border)]/20 rounded animate-pulse" />
              ) : sortedStages.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] py-4">
                  No pipeline data yet.
                </p>
              ) : (
                <div style={{ height: chartHeight }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sortedStages}
                      layout="vertical"
                      margin={{ top: 2, right: 68, left: 0, bottom: 2 }}
                    >
                      <XAxis type="number" hide domain={[0, 'dataMax']} />
                      <YAxis
                        type="category"
                        dataKey="stage"
                        width={96}
                        tickFormatter={(v: string) =>
                          v.charAt(0).toUpperCase() +
                          v.slice(1).replace(/-/g, ' ')
                        }
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={26}>
                        {sortedStages.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? CORAL : TEAL}
                          />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="right"
                          formatter={(v: number | string | (number | string)[]) =>
                            `$${(Number(v) / 1000).toFixed(0)}k`
                          }
                          style={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Expected revenue */}
            <div className="mb-8 bg-[var(--surface)] rounded-lg border border-[var(--border)] border-l-4 border-l-[#36747B] shadow-sm overflow-hidden">
              <div className="p-6">
                <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                  Expected revenue
                </p>
                <p className="text-4xl font-bold text-[var(--text-primary)] mt-1">
                  ${(expectedRevenue / 1000).toFixed(0)}k
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-[var(--text-secondary)] font-medium">
                    From current pipeline (stage-based close rates)
                  </p>
                  <button
                    onClick={() => setShowRates((v) => !v)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none focus:underline"
                    aria-expanded={showRates}
                  >
                    How is this calculated?
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${showRates ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>

              {/* Expandable close-rate table */}
              {showRates && (
                <div className="border-t border-[var(--border)] px-6 py-4">
                  <p className="text-xs text-[var(--text-secondary)] font-medium mb-3">
                    Each active deal's value is multiplied by its stage close rate and summed.
                    These are industry rule-of-thumb defaults, not derived from your historical data.
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="pb-2 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                          Stage
                        </th>
                        <th className="pb-2 text-right text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                          Close rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {STAGE_CLOSE_RATE_DISPLAY_ORDER.map(({ key, label }) => (
                        <tr key={key}>
                          <td className="py-2 text-sm text-[var(--text-primary)] font-medium">
                            {label}
                          </td>
                          <td className="py-2 text-right text-sm font-bold text-[var(--text-primary)]">
                            {((STAGE_CLOSE_RATES[key] ?? 0) * 100).toFixed(0)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Agent performance table */}
            <div className="mb-5">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">By agent</h2>
            </div>
            <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden shadow-sm mb-8">
              {sortedAgents.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    No agents found.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[var(--border)]/30 border-b border-[var(--border)]">
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">
                          Agent name
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">
                          Leads
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">
                          Pipeline value
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">
                          Conversion rate
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">
                          Follow-up overdue
                        </th>
                        <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider whitespace-nowrap">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {sortedAgents.map((agent) => (
                        <tr
                          key={agent.ownerId}
                          className="hover:bg-[var(--border)]/20 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <Link
                              href={`/leads?owner=${agent.ownerId}`}
                              className="text-sm font-bold text-[var(--text-primary)] hover:underline"
                            >
                              {agent.displayName}
                            </Link>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-[var(--text-primary)] font-medium">
                              {agent.leadCount}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-[var(--text-primary)]">
                              ${(agent.pipelineValue / 1000).toFixed(0)}k
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-[var(--text-primary)] font-medium">
                              {agent.conversionRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-sm font-medium ${
                                (followUpCounts[agent.ownerId] ?? 0) > 0
                                  ? 'text-amber-700 font-bold'
                                  : 'text-[var(--text-secondary)]'
                              }`}
                            >
                              {followUpCounts[agent.ownerId] ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {agent.needsSupport && (
                              <div className="space-y-1">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-[#FFDA90] text-slate-800">
                                  Needs support
                                </span>
                                <div className="space-y-0.5">
                                  {agent.supportReasons.map((reason, i) => (
                                    <p key={i} className="text-xs text-slate-500">
                                      {reason}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
