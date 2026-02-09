import { CRMLayout } from '@/components/crm-layout';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <CRMLayout>
      <div className="p-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics</h2>
          <p className="text-sm text-gray-500">Coming soon...</p>
        </div>
      </div>
    </CRMLayout>
  );
}
