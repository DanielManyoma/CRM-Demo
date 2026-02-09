import { Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function DashboardEmpty() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="text-center py-20 px-6">
        <div className="w-20 h-20 bg-coral-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-10 h-10 text-coral-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-950 mb-3">
          Welcome to your CRM
        </h2>
        <p className="text-base text-slate-600 max-w-md mx-auto mb-8 font-medium">
          Your dashboard will show key metrics and recent activity once you start adding leads. Ready to build your pipeline?
        </p>
        <Link
          href="/leads"
          className="inline-flex items-center px-6 py-3 rounded-lg text-base font-bold text-white bg-coral-600 hover:bg-coral-700 transition-all shadow-sm hover:shadow-md"
        >
          <Users className="w-5 h-5 mr-2" />
          Go to Leads
        </Link>
      </div>
    </div>
  );
}
