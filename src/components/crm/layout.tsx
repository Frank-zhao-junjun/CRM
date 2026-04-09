'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { CRMProvider } from '@/lib/crm-context';

export function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <CRMProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          <Header />
          <div className="flex-1 p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </CRMProvider>
  );
}
