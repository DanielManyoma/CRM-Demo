import type { Lead, LeadStatus } from './types';

// ─── Re-exported for consumers that previously imported from prioritization.ts ─

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

// ─── Decision-support helpers ────────────────────────────────────────────────

/** Days without contact that qualifies a high-priority lead as "follow-up due". */
const FOLLOW_UP_DUE_DAYS = 3;

/**
 * Returns high-priority leads whose last contact was more than 3 days ago.
 * Excludes closed leads. Sorted by lastContact ascending (most overdue first).
 */
export function getFollowUpDueLeads(leads: Lead[]): Lead[] {
  const now = new Date();
  return leads
    .filter((l) => {
      if (l.priority !== 'high') return false;
      if (l.status === 'closed-won' || l.status === 'closed-lost') return false;
      const last = l.lastContact instanceof Date ? l.lastContact : new Date(l.lastContact);
      const daysSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > FOLLOW_UP_DUE_DAYS;
    })
    .sort((a, b) => {
      const aDate = a.lastContact instanceof Date ? a.lastContact : new Date(a.lastContact);
      const bDate = b.lastContact instanceof Date ? b.lastContact : new Date(b.lastContact);
      return aDate.getTime() - bDate.getTime();
    });
}

export type PipelineValueByStage = Record<string, number>;

/**
 * Returns total pipeline value grouped by stage label.
 * Closed-lost deals are excluded (no remaining value).
 * Example: { New: 50000, Proposal: 145000, ... }
 */
export function getPipelineValue(leads: Lead[]): PipelineValueByStage {
  const STAGE_LABELS: Partial<Record<LeadStatus, string>> = {
    new: 'New',
    contacted: 'Contacted',
    qualified: 'Qualified',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    'closed-won': 'Closed Won',
  };
  const result: PipelineValueByStage = {};
  for (const lead of leads) {
    const label = STAGE_LABELS[lead.status];
    if (!label) continue; // skip closed-lost
    result[label] = (result[label] ?? 0) + lead.value;
  }
  return result;
}

/**
 * Returns conversion rate (won deals / all leads created within the window) as a percentage.
 * Only counts leads whose createdAt falls within the rolling `days` window.
 * Returns 0 if no leads were created in the period.
 */
export function getConversionRate(leads: Lead[], days: number = 30): number {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const inWindow = leads.filter((l) => {
    const created = l.createdAt instanceof Date ? l.createdAt : new Date(l.createdAt);
    return created >= cutoff;
  });
  if (inWindow.length === 0) return 0;
  const won = inWindow.filter((l) => l.status === 'closed-won').length;
  return (won / inWindow.length) * 100;
}

/** Scoring weights used by getNextBestActions. */
const PRIORITY_SCORE: Record<'low' | 'medium' | 'high', number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/** Cap staleness contribution so one very old lead doesn't dominate the list. Shared with getPriorityScore. */
const MAX_STALE_DAYS = 21;

/**
 * Returns the top N active leads ranked by a composite score:
 *   score = (priority weight × 10) + (days since last contact, capped at 21)
 *
 * Higher score = more urgent. Closed leads are excluded.
 */
export function getNextBestActions(leads: Lead[], n: number = 5): Lead[] {
  const now = new Date();
  const active = leads.filter(
    (l) => l.status !== 'closed-won' && l.status !== 'closed-lost'
  );
  const scored = active.map((l) => {
    const last = l.lastContact instanceof Date ? l.lastContact : new Date(l.lastContact);
    const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.min(Math.max(daysSince, 0), MAX_STALE_DAYS);
    const priorityScore = PRIORITY_SCORE[l.priority] * 10;
    return { lead: l, score: priorityScore + recencyScore };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((s) => s.lead);
}

// ─── Pipeline filtering helpers (consolidated from lib/prioritization.ts) ─────

/** Minimal shape needed by getPriorityScore — accepts Lead or a lighter API payload. */
export type LeadPriorityInput = {
  lastContact: Date;
  status: LeadStatus;
  value: number;
  priority?: 'low' | 'medium' | 'high';
};

/** Stage weights: later active stages rank higher; closed stages are zeroed out. */
const STAGE_WEIGHTS: Record<LeadStatus, number> = {
  new: 1,
  contacted: 2,
  qualified: 3,
  proposal: 4,
  negotiation: 5,
  'closed-won': 0,
  'closed-lost': 0,
};

/** Value scale factor so deal size influences score without overwhelming recency. */
const VALUE_SCALE = 10_000;

/**
 * Computes a single rule-based priority score for a lead. Higher = more urgent.
 * Factors: days since contact (recency), pipeline stage, deal value, priority flag.
 * Reuses MAX_STALE_DAYS and PRIORITY_SCORE defined above.
 */
export function getPriorityScore(lead: LeadPriorityInput): number {
  const now = new Date();
  const lastContact = lead.lastContact instanceof Date ? lead.lastContact : new Date(lead.lastContact);
  const daysSinceContact = Math.floor(
    (now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24)
  );
  const staleScore = Math.min(Math.max(daysSinceContact, 0), MAX_STALE_DAYS);
  const stageScore = STAGE_WEIGHTS[lead.status];
  const valueScore = lead.value / VALUE_SCALE;
  const priorityWeight = lead.priority ? PRIORITY_SCORE[lead.priority] : PRIORITY_SCORE.medium;
  return staleScore * 2 + stageScore * 10 + valueScore + priorityWeight * 5;
}

/**
 * Returns leads sorted by priority score descending (highest priority first).
 * Does not mutate the input array.
 */
export function sortLeadsByPriority(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
}

/** Days without contact after which any active lead is considered overdue for follow-up. */
export const FOLLOW_UP_DAYS_THRESHOLD = 7;

/**
 * Returns active leads not contacted within `threshold` days, sorted by priority.
 * Used by the ?followUp=true filter on the leads page and team-metrics coaching signals.
 * See also getFollowUpDueLeads (stricter: high-priority only, 3-day threshold).
 */
export function getLeadsNeedingFollowUp(
  leads: Lead[],
  options?: { maxDaysSinceContact?: number }
): Lead[] {
  const threshold = options?.maxDaysSinceContact ?? FOLLOW_UP_DAYS_THRESHOLD;
  const now = new Date();
  const active = leads.filter((l) => l.status !== 'closed-won' && l.status !== 'closed-lost');
  const needing = active.filter((l) => {
    const last = l.lastContact instanceof Date ? l.lastContact : new Date(l.lastContact);
    const days = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return days >= threshold;
  });
  return sortLeadsByPriority(needing);
}

/** Days of inactivity that flag a deal as stale (no stage movement proxy). */
export const PIPELINE_RISK_STALE_DAYS = 14;

/** Minimum deal value considered high-value for pipeline risk analysis. */
export const HIGH_VALUE_THRESHOLD = 50_000;

/**
 * Active leads with no contact in PIPELINE_RISK_STALE_DAYS days.
 * Used for the "X deals have not moved" pipeline risk signal.
 */
export function getLeadsStaleNoMovement(
  leads: Lead[],
  options?: { days?: number }
): Lead[] {
  const days = options?.days ?? PIPELINE_RISK_STALE_DAYS;
  const now = new Date();
  const active = leads.filter((l) => l.status !== 'closed-won' && l.status !== 'closed-lost');
  return active.filter((l) => {
    const last = l.lastContact instanceof Date ? l.lastContact : new Date(l.lastContact);
    const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= days;
  });
}

/**
 * Active high-value leads with no recent contact.
 * Used for the "Y high-value leads have no recent contact" pipeline risk signal.
 */
export function getHighValueNoRecentContact(
  leads: Lead[],
  options?: { valueThreshold?: number; days?: number }
): Lead[] {
  const valueThreshold = options?.valueThreshold ?? HIGH_VALUE_THRESHOLD;
  const days = options?.days ?? FOLLOW_UP_DAYS_THRESHOLD;
  const now = new Date();
  const active = leads.filter((l) => l.status !== 'closed-won' && l.status !== 'closed-lost');
  return active.filter((l) => {
    const last = l.lastContact instanceof Date ? l.lastContact : new Date(l.lastContact);
    const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return l.value >= valueThreshold && daysSince >= days;
  });
}

// ─── Dashboard filter link targets ───────────────────────────────────────────

/** Returns the median of a numeric array. Returns 0 for an empty array. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Active leads whose last contact was 14+ days ago (stage-movement proxy).
 * Linked from the Dashboard "X deals have not moved" signal via ?filter=stale.
 * Excludes closed leads. Sorted by priority score descending.
 *
 * Note: the Lead model has no stageChangedAt field, so lastContact is the
 * closest available signal for deal inactivity.
 */
export function getStaledLeads(leads: Lead[]): Lead[] {
  return sortLeadsByPriority(getLeadsStaleNoMovement(leads));
}

/**
 * Active leads in the top 50% of deal value (value >= median of active leads)
 * with no contact in 7+ days.
 * Linked from the Dashboard "X high-value leads" signal via ?filter=high-value-no-contact.
 * Sorted by deal value descending so the highest-risk deals surface first.
 *
 * Using a relative threshold (median) rather than a fixed dollar amount means
 * the filter adapts to whatever deal sizes are in this particular pipeline.
 */
export function getHighValueNoContactLeads(leads: Lead[]): Lead[] {
  const active = leads.filter(
    (l) => l.status !== 'closed-won' && l.status !== 'closed-lost'
  );
  if (active.length === 0) return [];

  const medianValue = median(active.map((l) => l.value));
  const now = new Date();

  const result = active.filter((l) => {
    if (l.value < medianValue) return false;
    const last = l.lastContact instanceof Date ? l.lastContact : new Date(l.lastContact);
    const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince >= FOLLOW_UP_DAYS_THRESHOLD;
  });

  return result.sort((a, b) => b.value - a.value);
}

// ─── Forecast inputs ──────────────────────────────────────────────────────────

/**
 * Assumed close rate per pipeline stage, used for the expected-revenue forecast.
 * These are rule-of-thumb defaults, not derived from historical win data.
 * Update this constant to change the forecast inputs; the calculation in
 * lib/forecast.ts imports and uses this directly.
 *
 * closed-won is included for display purposes (100%) but is excluded from the
 * revenue calculation — won deals are already realised revenue, not pipeline.
 */
export const STAGE_CLOSE_RATES: Record<string, number> = {
  new:         0.05,
  contacted:   0.15,
  qualified:   0.30,
  proposal:    0.50,
  negotiation: 0.70,
  'closed-won': 1.00,
};

/**
 * Ordered list of stages for consistent display in the forecast breakdown UI.
 * Drives the "How is this calculated?" table on the Team page.
 */
export const STAGE_CLOSE_RATE_DISPLAY_ORDER: Array<{
  key: string;
  label: string;
}> = [
  { key: 'new',         label: 'New' },
  { key: 'contacted',   label: 'Contacted' },
  { key: 'qualified',   label: 'Qualified' },
  { key: 'proposal',    label: 'Proposal' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'closed-won',  label: 'Closed' },
];
