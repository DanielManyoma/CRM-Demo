import { Plus, Users } from 'lucide-react';

interface EmptyStateProps {
  onAddLead?: () => void;
}

export function EmptyState({ onAddLead }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="text-center py-16 px-6">
        <div className="w-16 h-16 bg-coral-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-coral-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-950 mb-2">
          No leads yet
        </h3>
        <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6 font-medium">
          Start building your pipeline by adding your first lead. Track companies, contacts, and deals all in one place.
        </p>
        <button
          onClick={onAddLead}
          className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-coral-600 hover:bg-coral-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Your First Lead
        </button>
      </div>
    </div>
  );
}
