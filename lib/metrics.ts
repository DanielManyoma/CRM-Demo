import type { Lead } from './types';

export type PipelineStageRow = {
  stage: string;
  value: number;
};

/**
 * Centralized metric definitions. Use these everywhere (dashboard, team view, analytics)
 * so conversion, pipeline value, and activity are comparable and consistent.
 */
export function computeDashboardStats(leads: Lead[]) {
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const qualifiedLeads = leads.filter((l) => l.status === 'qualified').length;
  const proposalStage = leads.filter((l) => l.status === 'proposal').length;
  const wonDeals = leads.filter((l) => l.status === 'closed-won').length;
  const closedLostCount = leads.filter((l) => l.status === 'closed-lost').length;
  const activeCount = totalLeads - closedLostCount;
  const totalValue = leads
    .filter((l) => l.status !== 'closed-lost')
    .reduce((sum, lead) => sum + lead.value, 0);
  const avgDealSize = activeCount > 0 ? totalValue / activeCount : 0;
  const conversionRate =
    totalLeads > 0 ? (wonDeals / totalLeads) * 100 : 0;

  return {
    totalLeads,
    newLeads,
    qualifiedLeads,
    proposalStage,
    wonDeals,
    totalValue,
    avgDealSize,
    conversionRate,
  };
}

/**
 * Pipeline value by stage for charts. Same stage order everywhere.
 */
export function computePipelineStages(leads: Lead[]): PipelineStageRow[] {
  const statuses = [
    'new',
    'contacted',
    'qualified',
    'proposal',
    'negotiation',
    'closed-won',
  ] as const;
  const labels: Record<(typeof statuses)[number], string> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    'closed-won': 'Closed',
  };
  return statuses.map((status) => ({
    stage: labels[status],
    value: leads
      .filter((l) => l.status === status)
      .reduce((s, l) => s + l.value, 0),
  }));
}
