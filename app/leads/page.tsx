'use client';

import { CRMLayout } from '@/components/crm-layout';
import { LeadsTable } from '@/components/leads-table';
import { AddLeadModal } from '@/components/add-lead-modal';
import { useLeads } from '@/hooks/useLeads';
import {
  getLeadsNeedingFollowUp,
  getLeadsStaleNoMovement,
  getHighValueNoRecentContact,
  getStaledLeads,
  getHighValueNoContactLeads,
  sortLeadsByPriority,
} from '@/lib/metrics';
import type { Lead } from '@/lib/types';
import { Plus, Download, Settings, ArrowLeft } from 'lucide-react';
import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type ViewState = 'normal' | 'loading' | 'empty' | 'error';

function LeadsPageContent() {
  const searchParams = useSearchParams();
  const followUpFilter = searchParams.get('followUp') === 'true';
  const riskFilter = searchParams.get('risk'); // legacy: 'stale' | 'highValue'
  const filterParam = searchParams.get('filter'); // 'stale' | 'high-value-no-contact'
  const ownerFilter = searchParams.get('owner'); // agent id from team view
  const highlightLeadId = searchParams.get('lead') ?? undefined; // single-lead deep-link

  const [viewState, setViewState] = useState<ViewState>('normal');
  const { leads, addLead } = useLeads();
  const [showAddLead, setShowAddLead] = useState(false);

  const handleAddLead = () => setShowAddLead(true);

  const handleSaveNewLead = (lead: Lead) => {
    addLead(lead);
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
    // New filter param (from dashboard pipeline risk links)
    if (filterParam === 'stale' && data.length > 0) return getStaledLeads(data);
    if (filterParam === 'high-value-no-contact' && data.length > 0) return getHighValueNoContactLeads(data);
    // Legacy risk param (backward compat)
    if (riskFilter === 'stale' && data.length > 0) return sortLeadsByPriority(getLeadsStaleNoMovement(data));
    if (riskFilter === 'highValue' && data.length > 0) return sortLeadsByPriority(getHighValueNoRecentContact(data));
    return data;
  }, [followUpFilter, filterParam, riskFilter, ownerFilter, leads, viewState]);

  // If a specific lead is deep-linked but the active filters hide it, warn the user.
  const highlightedLeadName = useMemo(() => {
    if (!highlightLeadId) return null;
    return leads.find((l) => l.id === highlightLeadId)?.companyName ?? null;
  }, [highlightLeadId, leads]);

  const isHighlightedLeadFiltered =
    highlightLeadId != null &&
    highlightedLeadName != null &&
    !displayedLeads.some((l) => l.id === highlightLeadId);

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

        {/* Deep-link banner: shown when the target lead is hidden by an active filter */}
        {isHighlightedLeadFiltered && (
          <div className="mb-4 flex items-start gap-3 rounded-lg border border-coral-200 bg-coral-50 px-4 py-3">
            <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-coral-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-coral-900">
                &ldquo;{highlightedLeadName}&rdquo; is not visible with the current filter.
              </p>
              <p className="text-xs font-medium text-coral-700 mt-0.5">
                Clear the active filter to see and highlight this lead.
              </p>
            </div>
            <Link
              href={`/leads?lead=${highlightLeadId}`}
              className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold text-coral-700 hover:text-coral-900 hover:underline transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Clear filter
            </Link>
          </div>
        )}

        {/* Active filter banner — filter param (from dashboard pipeline risk links) */}
        {filterParam === 'stale' && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900">
                Showing: Stale deals — no stage movement in 14 days
              </p>
              <p className="text-xs text-amber-700 mt-0.5 font-medium">
                {displayedLeads.length} deal{displayedLeads.length !== 1 ? 's' : ''} match this filter, sorted by priority.
              </p>
            </div>
            <Link
              href="/leads"
              className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Clear filter
            </Link>
          </div>
        )}
        {filterParam === 'high-value-no-contact' && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900">
                Showing: High-value leads — no contact in 7+ days
              </p>
              <p className="text-xs text-amber-700 mt-0.5 font-medium">
                {displayedLeads.length} lead{displayedLeads.length !== 1 ? 's' : ''} in the top 50% of deal value with no recent contact, sorted by value.
              </p>
            </div>
            <Link
              href="/leads"
              className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 hover:underline transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Clear filter
            </Link>
          </div>
        )}

        {/* Legacy filter hints (followUp, risk, owner params) */}
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
            Showing leads for{' '}
            {leads.find((l) => l.ownerId === ownerFilter)?.owner ?? ownerFilter}.
          </p>
        )}

        {/* Leads Table */}
        <LeadsTable 
          leads={displayedLeads} 
          isLoading={viewState === 'loading'}
          error={viewState === 'error' ? 'Unable to fetch leads from the server. Please check your connection and try again.' : null}
          onAddLead={handleAddLead}
          onRetry={handleRetry}
          highlightLeadId={isHighlightedLeadFiltered ? undefined : highlightLeadId}
        />

        <AddLeadModal
          isOpen={showAddLead}
          onClose={() => setShowAddLead(false)}
          onSave={handleSaveNewLead}
          existingLeads={leads}
        />
      </div>

      {/* Floating Demo States button — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group/demo">
          <button
            aria-label="Demo states"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-800 text-white text-xs font-semibold shadow-lg hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2"
          >
            <Settings className="w-3.5 h-3.5" aria-hidden="true" />
            Demo states
          </button>
          <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover/demo:opacity-100 group-hover/demo:visible transition-all">
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
