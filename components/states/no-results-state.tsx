import { FilterX } from 'lucide-react';

interface NoResultsStateProps {
  onClearFilters: () => void;
  filterCount?: number;
}

export function NoResultsState({ onClearFilters, filterCount = 1 }: NoResultsStateProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="text-center py-16 px-6">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FilterX className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-950 mb-2">
          No leads match your filters
        </h3>
        <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6 font-medium">
          Try adjusting your filter criteria to see more results, or clear all filters to view your full pipeline.
        </p>
        <button
          onClick={onClearFilters}
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-300"
        >
          <FilterX className="w-4 h-4 mr-2" />
          Clear {filterCount > 1 ? 'Filters' : 'Filter'}
        </button>
      </div>
    </div>
  );
}
