import type { Lead, LeadStatus } from './types';

/** Minimal shape needed to compute a priority score (e.g. Lead or API payload). */
export type LeadPriorityInput = {
  lastContact: Date;
  status: LeadStatus;
  value: number;
  priority?: 'low' | 'medium' | 'high';
};

/** Stage weights for prioritization: later pipeline stages rank higher. Closed stages get 0. */
const STAGE_WEIGHTS: Record<LeadStatus, number> = {
  new: 1,
  contacted: 2,
  qualified: 3,
  proposal: 4,
  negotiation: 5,
  'closed-won': 0,
  'closed-lost': 0,
};

/** Priority flag contribution (optional field). */
const PRIORITY_WEIGHTS = {
  low: 1,
  medium: 2,
  high: 3,
} as const;

/** Max days since contact that count toward "stale" score (avoids one very old lead dominating). */
const MAX_STALE_DAYS = 21;

/** Value scale factor so deal size influences score without overwhelming other signals. */
const VALUE_SCALE = 10000;

/**
 * Computes a single priority score for a lead (rule-based, no AI).
 * Higher score = higher priority for follow-up.
 *
 * Factors:
 * - Stale contact: more days since lastContact → higher score (capped).
 * - Stage: later active stage → higher score; closed stages → 0.
 * - Value: higher deal value → higher score (scaled).
 * - Optional priority flag: high > medium > low.
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
  const priorityScore = lead.priority ? PRIORITY_WEIGHTS[lead.priority] : PRIORITY_WEIGHTS.medium;

  return staleScore * 2 + stageScore * 10 + valueScore + priorityScore * 5;
}

/**
 * Returns leads sorted by priority score descending (highest first).
 * Uses lastContact, status, value, and optional priority only; does not mutate input.
 */
export function sortLeadsByPriority(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
}

/** Default: leads with no contact in this many days are "due" for follow-up. */
export const FOLLOW_UP_DAYS_THRESHOLD = 7;

/**
 * Returns active (non-closed) leads that have not been contacted within the threshold days,
 * sorted by priority score descending. Used for "Follow up today" count and filtered list.
 */
export function getLeadsNeedingFollowUp(
  leads: Lead[],
  options?: { maxDaysSinceContact?: number }
): Lead[] {
  const threshold = options?.maxDaysSinceContact ?? FOLLOW_UP_DAYS_THRESHOLD;
  const now = new Date();
  const active = leads.filter(
    (l) => l.status !== 'closed-won' && l.status !== 'closed-lost'
  );
  const needing = active.filter((l) => {
    const last =
      l.lastContact instanceof Date ? l.lastContact : new Date(l.lastContact);
    const days = Math.floor(
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );
    return days >= threshold;
  });
  return sortLeadsByPriority(needing);
}

/** Days without contact to consider a deal "stale" (no movement). */
export const PIPELINE_RISK_STALE_DAYS = 14;

/** Minimum value to consider "high-value" for risk. */
export const HIGH_VALUE_THRESHOLD = 50_000;

/**
 * Active leads with no contact in PIPELINE_RISK_STALE_DAYS (proxy for "no stage movement").
 */
export function getLeadsStaleNoMovement(
  leads: Lead[],
  options?: { days?: number }
): Lead[] {
  const days = options?.days ?? PIPELINE_RISK_STALE_DAYS;
  const now = new Date();
  const active = leads.filter(
    (l) => l.status !== 'closed-won' && l.status !== 'closed-lost'
  );
  return active.filter((l) => {
    const last =
      l.lastContact instanceof Date ? l.lastContact : new Date(l.lastContact);
    const daysSince = Math.floor(
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince >= days;
  });
}

/**
 * Active high-value leads with no recent contact (e.g. 7+ days).
 */
export function getHighValueNoRecentContact(
  leads: Lead[],
  options?: { valueThreshold?: number; days?: number }
): Lead[] {
  const valueThreshold = options?.valueThreshold ?? HIGH_VALUE_THRESHOLD;
  const days = options?.days ?? FOLLOW_UP_DAYS_THRESHOLD;
  const now = new Date();
  const active = leads.filter(
    (l) => l.status !== 'closed-won' && l.status !== 'closed-lost'
  );
  return active.filter((l) => {
    const last =
      l.lastContact instanceof Date ? l.lastContact : new Date(l.lastContact);
    const daysSince = Math.floor(
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    );
    return l.value >= valueThreshold && daysSince >= days;
  });
}
