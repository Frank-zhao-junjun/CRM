'use client';

import { CRMLayout } from '@/components/crm/layout';
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <CRMLayout>{children}</CRMLayout>
      </body>
    </html>
  );
}
