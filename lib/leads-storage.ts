import type { Lead } from './types';
import { mockLeads } from './mock-data';

const STORAGE_KEY = 'crm-leads';

/** Serialize leads for localStorage (dates to ISO strings). */
function serialize(leads: Lead[]): string {
  return JSON.stringify(
    leads.map((l) => ({
      ...l,
      lastContact: l.lastContact instanceof Date ? l.lastContact.toISOString() : l.lastContact,
      createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
    }))
  );
}

/** Revive date fields after JSON.parse. */
function revive(rows: unknown): Lead[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row: Record<string, unknown>) => {
    const raw = { ...row } as Lead & { lastContact?: string | Date; createdAt?: string | Date; ownerId?: string };
    const lastContact =
      typeof raw.lastContact === 'string' ? new Date(raw.lastContact) : (raw.lastContact as Date);
    const createdAt =
      typeof raw.createdAt === 'string' ? new Date(raw.createdAt) : (raw.createdAt as Date);
    const ownerId = raw.ownerId ?? 'agent-1';
    return { ...raw, lastContact, createdAt, ownerId } as Lead;
  });
}

/**
 * Load leads from localStorage. Returns mock data if empty or invalid.
 * Call from client only (useEffect or event).
 */
export function loadLeads(): Lead[] {
  if (typeof window === 'undefined') return mockLeads;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return mockLeads;
    const parsed = JSON.parse(raw) as unknown;
    const revived = revive(parsed);
    return revived.length > 0 ? revived : mockLeads;
  } catch {
    return mockLeads;
  }
}

/**
 * Save leads to localStorage. Call after any add/update.
 */
export function saveLeads(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serialize(leads));
  } catch {
    // ignore quota or other errors
  }
}
