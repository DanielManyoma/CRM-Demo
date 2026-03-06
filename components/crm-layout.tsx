'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Settings, BarChart3, UserCog } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Team', href: '/team', icon: UserCog },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[var(--bg)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--surface)] border-r border-[var(--border)]">
        <div className="flex flex-col h-full">
          {/* Header: logo + theme toggle */}
          <div className="flex items-center justify-between gap-2 h-16 px-4 border-b border-[var(--border)]">
            <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">Signal CRM</h1>
            <ThemeToggle />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2.5 text-sm font-semibold rounded-lg transition-all
                    ${isActive
                      ? 'bg-[var(--accent-muted)] text-[var(--accent-muted-text)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--border)]/50 hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-[var(--border)]">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-coral-500 to-coral-700 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white">SA</span>
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)] truncate">Sales Admin</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">admin@company.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
