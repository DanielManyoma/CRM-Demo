import type { Lead } from './types';

/**
 * Simple stage-based close rates (rule of thumb). Used for "expected revenue" range.
 * Only active stages; closed-won is already realized.
 */
const STAGE_CLOSE_RATES: Record<string, number> = {
  new: 0.05,
  contacted: 0.1,
  qualified: 0.2,
  proposal: 0.35,
  negotiation: 0.6,
};

/**
 * Expected revenue from pipeline: sum of (stage value × stage close rate).
 * Gives a single number; team lead can treat as rough "expected" range.
 */
export function expectedRevenueFromPipeline(leads: Lead[]): number {
  const active = leads.filter(
    (l) => l.status !== 'closed-won' && l.status !== 'closed-lost'
  );
  let total = 0;
  for (const lead of active) {
    const rate = STAGE_CLOSE_RATES[lead.status] ?? 0.1;
    total += lead.value * rate;
  }
  return Math.round(total);
}
