'use client';

import type { Lead } from '@/lib/types';
import { loadLeads, saveLeads } from '@/lib/leads-storage';
import { mockLeads } from '@/lib/mock-data';
import { createContext, useContext, useEffect, useState } from 'react';

type LeadsContextValue = {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
};

const LeadsContext = createContext<LeadsContextValue | null>(null);

export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);

  useEffect(() => {
    const stored = loadLeads();
    setLeads(stored);
  }, []);

  useEffect(() => {
    saveLeads(leads);
  }, [leads]);

  return (
    <LeadsContext.Provider value={{ leads, setLeads }}>
      {children}
    </LeadsContext.Provider>
  );
}

export function useLeads(): LeadsContextValue {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error('useLeads must be used within LeadsProvider');
  return ctx;
}
