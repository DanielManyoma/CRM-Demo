import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  onRetry?: () => void;
  message?: string;
}

export function ErrorState({ onRetry, message }: ErrorStateProps) {
  return (
    <div className="bg-white rounded-lg border border-rose-200 shadow-sm">
      <div className="text-center py-16 px-6">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-950 mb-2">
          Unable to load leads
        </h3>
        <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6 font-medium">
          {message || 'Something went wrong while loading your data. This is usually temporary—try refreshing to see if it resolves.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all shadow-sm hover:shadow-md"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
