'use client';

import { CRMLayout } from '@/components/crm-layout';
import { LeadsTable } from '@/components/leads-table';
import { AddLeadModal } from '@/components/add-lead-modal';
import { useLeads } from '@/components/leads-provider';
import {
  getLeadsNeedingFollowUp,
  getLeadsStaleNoMovement,
  getHighValueNoRecentContact,
  sortLeadsByPriority,
} from '@/lib/prioritization';
import type { Lead } from '@/lib/types';
import { Plus, Download, Settings } from 'lucide-react';
import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

type ViewState = 'normal' | 'loading' | 'empty' | 'error';

function LeadsPageContent() {
  const searchParams = useSearchParams();
  const followUpFilter = searchParams.get('followUp') === 'true';
  const riskFilter = searchParams.get('risk'); // 'stale' | 'highValue'
  const ownerFilter = searchParams.get('owner'); // agent id from team view

  const [viewState, setViewState] = useState<ViewState>('normal');
  const { leads, setLeads } = useLeads();
  const [showAddLead, setShowAddLead] = useState(false);

  const handleAddLead = () => setShowAddLead(true);

  const handleSaveNewLead = (lead: Lead) => {
    setLeads((prev) => [...prev, lead]);
    setShowAddLead(false);
    if (viewState === 'empty') setViewState('normal');
  };

  const handleRetry = () => {
    setViewState('loading');
    setTimeout(() => setViewState('normal'), 1500);
  };

  const getLeadsData = (): Lead[] => {
    if (viewState === 'empty') return [];
    return leads;
  };

  const displayedLeads = useMemo(() => {
    let data = getLeadsData();
    if (viewState === 'empty') return [];
    if (ownerFilter) data = data.filter((l) => (l.ownerId ?? 'agent-1') === ownerFilter);
    if (followUpFilter && data.length > 0) return getLeadsNeedingFollowUp(data);
    if (riskFilter === 'stale' && data.length > 0) return sortLeadsByPriority(getLeadsStaleNoMovement(data));
    if (riskFilter === 'highValue' && data.length > 0) return sortLeadsByPriority(getHighValueNoRecentContact(data));
    return data;
  }, [followUpFilter, riskFilter, ownerFilter, leads, viewState]);

  return (
    <CRMLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Leads</h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)] font-medium">
                Manage and track your sales pipeline
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* State switcher for demo */}
              <div className="relative group">
                <button className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 transition-all">
                  <Settings className="w-3.5 h-3.5 mr-1.5" />
                  Demo States
                </button>
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <div className="p-1">
                    <button
                      onClick={() => setViewState('normal')}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold rounded transition-colors ${
                        viewState === 'normal' ? 'bg-coral-50 text-coral-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => setViewState('loading')}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold rounded transition-colors ${
                        viewState === 'loading' ? 'bg-coral-50 text-coral-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Loading
                    </button>
                    <button
                      onClick={() => setViewState('empty')}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold rounded transition-colors ${
                        viewState === 'empty' ? 'bg-coral-50 text-coral-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Empty
                    </button>
                    <button
                      onClick={() => setViewState('error')}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold rounded transition-colors ${
                        viewState === 'error' ? 'bg-coral-50 text-coral-900' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Error
                    </button>
                  </div>
                </div>
              </div>

              <button className="inline-flex items-center px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button 
                onClick={handleAddLead}
                className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-coral-600 hover:bg-coral-700 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </button>
            </div>
          </div>
        </div>

        {/* Filter hint */}
        {followUpFilter && (
          <p className="mb-4 text-sm text-[var(--text-secondary)] font-medium">
            Showing only leads that need follow-up (no contact in 7+ days), sorted by priority.
          </p>
        )}
        {riskFilter === 'stale' && (
          <p className="mb-4 text-sm text-[var(--text-secondary)] font-medium">
            Showing deals with no contact in 14+ days (pipeline risk), sorted by priority.
          </p>
        )}
        {riskFilter === 'highValue' && (
          <p className="mb-4 text-sm text-[var(--text-secondary)] font-medium">
            Showing high-value leads with no recent contact, sorted by priority.
          </p>
        )}
        {ownerFilter && (
          <p className="mb-4 text-sm text-[var(--text-secondary)] font-medium">
            Showing leads for {ownerFilter === 'agent-1' ? 'Agent 1' : ownerFilter === 'agent-2' ? 'Agent 2' : ownerFilter}.
          </p>
        )}

        {/* Leads Table */}
        <LeadsTable 
          leads={displayedLeads} 
          isLoading={viewState === 'loading'}
          error={viewState === 'error' ? 'Unable to fetch leads from the server. Please check your connection and try again.' : null}
          onAddLead={handleAddLead}
          onRetry={handleRetry}
        />

        <AddLeadModal
          isOpen={showAddLead}
          onClose={() => setShowAddLead(false)}
          onSave={handleSaveNewLead}
          existingLeads={leads}
        />
      </div>
    </CRMLayout>
  );
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <CRMLayout>
          <div className="p-8">
            <div className="h-8 w-48 bg-[var(--border)] rounded animate-pulse mb-8" />
            <div className="h-64 bg-[var(--border)]/30 rounded animate-pulse" />
          </div>
        </CRMLayout>
      }
    >
      <LeadsPageContent />
    </Suspense>
  );
}
