'use client';

import { useCallback } from 'react';
import { useLeads as useLeadsContext } from '@/components/leads-provider';
import type { Lead } from '@/lib/types';

export type UseLeadsReturn = {
  /** All leads, hydrated from localStorage on first load (falls back to mock data). */
  leads: Lead[];
  /**
   * Adds a new lead to the list and immediately persists to localStorage.
   * Callers are responsible for supplying a unique `id`.
   */
  addLead: (lead: Lead) => void;
  /**
   * Merges `changes` into the lead matching `id` and persists to localStorage.
   * No-ops silently if no lead with that id exists.
   */
  updateLead: (id: string, changes: Partial<Lead>) => void;
};

/**
 * Primary data hook for lead management.
 *
 * Reads from LeadsContext (backed by localStorage with mock-data fallback).
 * Exposes typed, stable mutations instead of raw state dispatch so callers
 * never need to know about the underlying setLeads shape.
 *
 * Must be used inside a component tree wrapped with <LeadsProvider>
 * (already present in app/layout.tsx).
 */
export function useLeads(): UseLeadsReturn {
  const { leads, setLeads } = useLeadsContext();

  const addLead = useCallback(
    (lead: Lead) => {
      setLeads((prev) => [...prev, lead]);
    },
    [setLeads]
  );

  const updateLead = useCallback(
    (id: string, changes: Partial<Lead>) => {
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...changes } : l))
      );
    },
    [setLeads]
  );

  return { leads, addLead, updateLead };
}
