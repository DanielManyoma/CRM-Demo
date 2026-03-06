import type { Lead } from './types';
import {
  computeDashboardStats,
  getConversionRate,
  getFollowUpDueLeads,
  getLeadsStaleNoMovement,
} from './metrics';

export type AgentSummary = {
  ownerId: string;
  displayName: string;
  leadCount: number;
  pipelineValue: number;
  conversionRate: number;
  wonDeals: number;
  needsSupport: boolean;
  /**
   * Every support signal that fired, in priority order.
   * Empty array when needsSupport is false.
   */
  supportReasons: string[];
};

const AGENT_DISPLAY_NAMES: Record<string, string> = {
  'agent-1': 'Marcus Reid',
  'agent-2': 'Priya Nair',
  'agent-3': 'Jordan Cross',
};

function displayName(ownerId: string): string {
  return AGENT_DISPLAY_NAMES[ownerId] ?? ownerId;
}

/** Unique owner ids from leads. */
export function getAgentIds(leads: Lead[]): string[] {
  const set = new Set(leads.map((l) => l.ownerId ?? 'agent-1').filter(Boolean));
  return Array.from(set).sort();
}

// ─── Support signal thresholds ────────────────────────────────────────────────

/** Minimum high-priority leads overdue by 3+ days to trigger signal 1. */
const OVERDUE_FOLLOWUP_MIN = 3;

/** 30-day conversion rate below this % triggers signal 2. */
const LOW_CONVERSION_RATE_PCT = 10;

/**
 * Minimum leads created within the 30-day window before signal 2 is evaluated.
 * Prevents a false positive when an agent simply has no recent leads to close.
 */
const LOW_CONVERSION_MIN_WINDOW_LEADS = 2;

/** Minimum active leads with no contact in 14+ days to trigger signal 3. */
const STUCK_PIPELINE_MIN = 2;

/**
 * Per-agent stats. "Needs support" fires when ANY of three signals triggers:
 *
 *  1. Overdue follow-ups — 3+ high-priority leads not contacted in 3+ days.
 *  2. Low conversion    — <10% conversion over the last 30 days (min 2 leads in window).
 *  3. Stuck pipeline    — 2+ active leads with no contact in 14+ days.
 *
 * `supportReasons` lists every signal that fired so the UI can surface the
 * specific coaching prompt rather than a generic flag.
 */
export function getAgentSummaries(leads: Lead[]): AgentSummary[] {
  const now = new Date();
  const thirtyDayCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const agentIds = getAgentIds(leads);
  return agentIds.map((ownerId) => {
    const agentLeads = leads.filter((l) => (l.ownerId ?? 'agent-1') === ownerId);
    const stats = computeDashboardStats(agentLeads);

    // Signal 1 — Overdue follow-ups
    // Uses getFollowUpDueLeads: high-priority only, 3-day threshold.
    const overdueLeads = getFollowUpDueLeads(agentLeads);
    const overdueCount = overdueLeads.length;
    const hasOverdueFollowUps = overdueCount >= OVERDUE_FOLLOWUP_MIN;

    // Signal 2 — Low 30-day conversion rate
    // Only evaluated when the agent has enough recent leads to make the rate meaningful.
    const recentLeads = agentLeads.filter((l) => {
      const created = l.createdAt instanceof Date ? l.createdAt : new Date(l.createdAt);
      return created >= thirtyDayCutoff;
    });
    const thirtyDayRate = getConversionRate(agentLeads, 30);
    const hasLowConversion =
      recentLeads.length >= LOW_CONVERSION_MIN_WINDOW_LEADS &&
      thirtyDayRate < LOW_CONVERSION_RATE_PCT;

    // Signal 3 — Stuck pipeline
    // Uses lastContact as the closest proxy for "no stage movement" since the
    // Lead type does not carry a dedicated stageChangedAt timestamp.
    const stuckLeads = getLeadsStaleNoMovement(agentLeads);
    const stuckCount = stuckLeads.length;
    const hasStuckPipeline = stuckCount >= STUCK_PIPELINE_MIN;

    const supportReasons: string[] = [];
    if (hasOverdueFollowUps) {
      supportReasons.push(
        `${overdueCount} overdue follow-up${overdueCount !== 1 ? 's' : ''}`
      );
    }
    if (hasLowConversion) {
      supportReasons.push(
        `${thirtyDayRate.toFixed(1)}% conversion rate (30 days)`
      );
    }
    if (hasStuckPipeline) {
      supportReasons.push(`${stuckCount} deals stuck ≥ 14 days`);
    }

    return {
      ownerId,
      displayName: displayName(ownerId),
      leadCount: stats.totalLeads,
      pipelineValue: stats.totalValue,
      conversionRate: stats.conversionRate,
      wonDeals: stats.wonDeals,
      needsSupport: supportReasons.length > 0,
      supportReasons,
    };
  });
}
