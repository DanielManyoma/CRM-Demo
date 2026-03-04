import type { Lead } from './types';
import { computeDashboardStats } from './metrics';
import { getLeadsNeedingFollowUp } from './metrics';

export type AgentSummary = {
  ownerId: string;
  displayName: string;
  leadCount: number;
  pipelineValue: number;
  conversionRate: number;
  wonDeals: number;
  needsSupport: boolean;
  supportReason?: string;
};

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  'agent-1': 'Agent 1',
  'agent-2': 'Agent 2',
  'agent-3': 'Agent 3',
};

function displayName(ownerId: string): string {
  return AGENT_DISPLAY_NAMES[ownerId] ?? ownerId;
}

/** Unique owner ids from leads. */
export function getAgentIds(leads: Lead[]): string[] {
  const set = new Set(leads.map((l) => l.ownerId ?? 'agent-1').filter(Boolean));
  return Array.from(set).sort();
}

/**
 * Per-agent stats using same definitions as dashboard. "Needs support" if:
 * - No follow-up activity (has leads due for follow-up and count is high), or
 * - Conversion below 20% with at least 5 leads (simple threshold).
 */
export function getAgentSummaries(leads: Lead[]): AgentSummary[] {
  const agentIds = getAgentIds(leads);
  return agentIds.map((ownerId) => {
    const agentLeads = leads.filter((l) => (l.ownerId ?? 'agent-1') === ownerId);
    const stats = computeDashboardStats(agentLeads);
    const followUp = getLeadsNeedingFollowUp(agentLeads);
    const needsFollowUp = followUp.length;
    const lowConversion =
      agentLeads.length >= 5 && stats.conversionRate < 20;
    const needsSupport = needsFollowUp > 3 || lowConversion;
    const supportReason = needsFollowUp > 3
      ? `${needsFollowUp} leads need follow-up`
      : lowConversion
        ? 'Conversion below 20%'
        : undefined;
    return {
      ownerId,
      displayName: displayName(ownerId),
      leadCount: stats.totalLeads,
      pipelineValue: stats.totalValue,
      conversionRate: stats.conversionRate,
      wonDeals: stats.wonDeals,
      needsSupport,
      supportReason,
    };
  });
}
