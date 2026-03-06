import type { Lead } from './types';
import { STAGE_CLOSE_RATES } from './metrics';

/**
 * Expected revenue from pipeline: sum of (stage value × stage close rate).
 * Close rates are defined in lib/metrics.ts as STAGE_CLOSE_RATES.
 * Gives a single number; team lead can treat as a rough "expected" range.
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
