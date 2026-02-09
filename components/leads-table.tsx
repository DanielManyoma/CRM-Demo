'use client';

import { Lead, LeadStatus } from '@/lib/types';
import { ArrowUpDown, Mail, Phone, MoreHorizontal, Eye, Edit2, AlertCircle, ChevronDown, Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { TableSkeleton } from './states/table-skeleton';
import { EmptyState } from './states/empty-state';
import { NoResultsState } from './states/no-results-state';
import { ErrorState } from './states/error-state';

interface LeadsTableProps {
  leads: Lead[];
  isLoading?: boolean;
  error?: string | null;
  onAddLead?: () => void;
  onRetry?: () => void;
}

type SortField = 'companyName' | 'status' | 'value' | 'lastContact' | 'priority';
type SortDirection = 'asc' | 'desc';

const statusConfig: Record<LeadStatus, { label: string; colors: string }> = {
  'new': { label: 'New', colors: 'bg-slate-100 text-slate-800 border-slate-300' },
  'contacted': { label: 'Contacted', colors: 'bg-amber-100 text-amber-900 border-amber-300' },
  'qualified': { label: 'Qualified', colors: 'bg-cyan-100 text-cyan-900 border-cyan-400' },
  'proposal': { label: 'Proposal', colors: 'bg-indigo-100 text-indigo-900 border-indigo-400' },
  'negotiation': { label: 'Negotiation', colors: 'bg-violet-100 text-violet-900 border-violet-400' },
  'closed-won': { label: 'Won', colors: 'bg-emerald-100 text-emerald-900 border-emerald-400' },
  'closed-lost': { label: 'Lost', colors: 'bg-rose-100 text-rose-900 border-rose-300' },
};

const priorityConfig = {
  high: { label: 'High', color: 'text-coral-600 font-bold' },
  medium: { label: 'Med', color: 'text-amber-700 font-semibold' },
  low: { label: 'Low', color: 'text-slate-500 font-medium' },
};

function FilterDropdown({
  selectedStatuses,
  setSelectedStatuses,
  leads,
  statusConfig,
  open,
  onToggle,
}: {
  selectedStatuses: Set<LeadStatus>;
  setSelectedStatuses: (s: Set<LeadStatus>) => void;
  leads: Lead[];
  statusConfig: Record<LeadStatus, { label: string; colors: string }>;
  open: boolean;
  onToggle: () => void;
}) {
  const toggleStatus = (status: LeadStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };
  const clearFilters = () => setSelectedStatuses(new Set());
  const statusesWithCount = (Object.entries(statusConfig) as [LeadStatus, { label: string; colors: string }][]).map(
    ([status, config]) => ({ status, ...config, count: leads.filter((l) => l.status === status).length })
  ).filter((s) => s.count > 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
          selectedStatuses.size > 0
            ? 'bg-coral-50 border-coral-200 text-coral-900'
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filter by status
        {selectedStatuses.size > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-md bg-coral-200/80 text-coral-900 text-xs font-bold">
            {selectedStatuses.size}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-2">
          <div className="px-3 pb-2 border-b border-slate-200">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-bold text-slate-600 hover:text-slate-950"
            >
              Clear all
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {statusesWithCount.map(({ status, label, count }) => (
              <label
                key={status}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedStatuses.has(status)}
                  onChange={() => toggleStatus(status)}
                  className="rounded border-slate-300 text-coral-600 focus:ring-coral-500"
                />
                <span className="text-sm font-medium text-slate-800">{label}</span>
                <span className="text-xs text-slate-500 ml-auto">({count})</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function LeadsTable({ leads, isLoading = false, error = null, onAddLead, onRetry }: LeadsTableProps) {
  const [sortField, setSortField] = useState<SortField>('lastContact');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<LeadStatus>>(new Set());
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setFilterDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedLeads = leads
    .filter(lead => selectedStatuses.size === 0 || selectedStatuses.has(lead.status))
    .sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'companyName':
          return multiplier * a.companyName.localeCompare(b.companyName);
        case 'value':
          return multiplier * (a.value - b.value);
        case 'lastContact':
          return multiplier * (a.lastContact.getTime() - b.lastContact.getTime());
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return multiplier * (priorityOrder[a.priority] - priorityOrder[b.priority]);
        case 'status':
          return multiplier * a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDaysStale = (lastContact: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - lastContact.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const isLeadStale = (lead: Lead) => {
    const daysStale = getDaysStale(lead.lastContact);
    // Consider a lead stale if not contacted recently based on status
    if (lead.status === 'new' && daysStale > 2) return true;
    if (lead.status === 'contacted' && daysStale > 5) return true;
    if (['qualified', 'proposal', 'negotiation'].includes(lead.status) && daysStale > 3) return true;
    return false;
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-slate-950 transition-colors group/sort"
    >
      {children}
      <ArrowUpDown className={`w-3.5 h-3.5 transition-colors ${sortField === field ? 'text-slate-950' : 'text-slate-400 group-hover/sort:text-slate-600'}`} />
    </button>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-36 bg-slate-100 rounded-lg animate-pulse" />
        <TableSkeleton />
        <div className="h-5 w-32 bg-slate-100 rounded animate-pulse" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorState onRetry={onRetry} message={error} />
      </div>
    );
  }

  // Empty state (no leads at all)
  if (leads.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyState onAddLead={onAddLead} />
      </div>
    );
  }

  // No results state (after filtering)
  const hasActiveFilters = selectedStatuses.size > 0;
  if (filteredAndSortedLeads.length === 0 && hasActiveFilters) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2" ref={filterDropdownRef}>
          <FilterDropdown
            selectedStatuses={selectedStatuses}
            setSelectedStatuses={setSelectedStatuses}
            leads={leads}
            statusConfig={statusConfig}
            open={filterDropdownOpen}
            onToggle={() => setFilterDropdownOpen((v) => !v)}
          />
        </div>
        <NoResultsState 
          onClearFilters={() => setSelectedStatuses(new Set())}
          filterCount={selectedStatuses.size}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter multiselect */}
      <div className="flex items-center gap-2" ref={filterDropdownRef}>
        <FilterDropdown
          selectedStatuses={selectedStatuses}
          setSelectedStatuses={setSelectedStatuses}
          leads={leads}
          statusConfig={statusConfig}
          open={filterDropdownOpen}
          onToggle={() => setFilterDropdownOpen((v) => !v)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <SortButton field="companyName">Lead</SortButton>
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <SortButton field="status">Status</SortButton>
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <SortButton field="value">Deal Value</SortButton>
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  <SortButton field="lastContact">Activity</SortButton>
                </th>
                <th className="w-24 px-6 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredAndSortedLeads.map((lead) => {
                const isStale = isLeadStale(lead);

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    {/* Company & Contact - PRIMARY INFO */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-coral-500 to-coral-700 rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-sm font-bold text-white">
                            {lead.companyName.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          {/* PRIMARY: Company name - largest, boldest */}
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-950 truncate">
                              {lead.companyName}
                            </h3>
                            {isStale && (
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" title="Needs follow-up" />
                            )}
                          </div>
                          {/* SECONDARY: Contact name - medium weight */}
                          <p className="text-sm text-slate-600 mt-0.5 font-medium">{lead.contactName}</p>
                          {/* CONTEXTUAL: Source & contact info - smallest, appears on hover */}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs text-slate-400 font-medium capitalize">
                              {lead.source.replace('-', ' ')}
                            </span>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a
                                href={`mailto:${lead.email}`}
                                className="text-xs text-slate-500 hover:text-coral-600 transition-colors flex items-center gap-1"
                                title={lead.email}
                              >
                                <Mail className="w-3 h-3" />
                              </a>
                              <a
                                href={`tel:${lead.phone}`}
                                className="text-xs text-slate-500 hover:text-coral-600 transition-colors flex items-center gap-1"
                                title={lead.phone}
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status - PRIMARY INFO */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${
                          statusConfig[lead.status].colors
                        } shadow-sm`}
                      >
                        {statusConfig[lead.status].label}
                      </span>
                    </td>

                    {/* Deal Value - PRIMARY INFO */}
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-slate-950 tabular-nums">
                        ${lead.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium tabular-nums">
                        ~${(lead.value / 12).toFixed(0)}/mo
                      </p>
                    </td>

                    {/* Last Contact - SECONDARY INFO */}
                    <td className="px-6 py-4">
                      <div>
                        <p className={`text-sm font-bold ${
                          isStale ? 'text-amber-700' : 'text-slate-950'
                        }`}>
                          {formatDate(lead.lastContact)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Created {formatDate(lead.createdAt)}
                        </p>
                      </div>
                    </td>

                    {/* Actions - appear on hover */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-all"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-all"
                          title="Edit lead"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-all"
                          title="More actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Results count */}
      <div className="text-sm text-slate-700 font-semibold">
        Showing {filteredAndSortedLeads.length} of {leads.length} leads
      </div>
    </div>
  );
}
