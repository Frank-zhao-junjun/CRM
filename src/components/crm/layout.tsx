'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileHeader } from './mobile-header';
import { CRMProvider } from '@/lib/crm-context';

export function CRMLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <CRMProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header - Only visible on mobile */}
          <MobileHeader onMenuToggle={() => setMobileMenuOpen(true)} />
          
          {/* Desktop Header - Only visible on desktop */}
          <div className="hidden lg:block">
            <Header />
          </div>
          
          <div className="flex-1 p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </CRMProvider>
  );
}
