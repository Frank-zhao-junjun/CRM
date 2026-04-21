'use client';

import { CRMProvider } from '@/lib/crm-context';

export default function ReportsLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CRMProvider>
      {children}
    </CRMProvider>
  );
}
