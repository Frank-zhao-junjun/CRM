'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receipt, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Invoice {
  id: string;
  invoice_number: string;
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  total: number;
  issue_date: string;
  due_date?: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

const INVOICE_STATUS_CONFIG: Record<string, { label: string; className: string; color: string }> = {
  draft: { label: '草稿', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', color: 'text-gray-600 dark:text-gray-400' },
  issued: { label: '已开票', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400' },
  paid: { label: '已收款', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', color: 'text-green-600 dark:text-green-400' },
  overdue: { label: '已逾期', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', color: 'text-red-600 dark:text-red-400' },
  cancelled: { label: '已作废', className: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20', color: 'text-stone-600 dark:text-stone-400' },
  refunded: { label: '已退款', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', color: 'text-orange-600 dark:text-orange-400' },
};

interface CustomerInvoicesCardProps {
  customerId: string;
  className?: string;
}

export function CustomerInvoicesCard({ customerId, className }: CustomerInvoicesCardProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm?type=invoices&customerId=${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(Array.isArray(data) ? data : []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10">
            <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          发票
          {invoices.length > 0 && (
            <Badge variant="secondary" className="ml-1">{invoices.length}</Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/invoices/new?customerId=${customerId}`}>
            添加
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">暂无发票</p>
            <Button variant="link" size="sm" asChild className="mt-2">
              <Link href={`/invoices/new?customerId=${customerId}`}>
                创建发票
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.slice(0, 5).map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{invoice.invoice_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(invoice.issue_date), 'yyyy/MM/dd', { locale: zhCN })}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Badge variant="outline" className={cn('text-xs', INVOICE_STATUS_CONFIG[invoice.status]?.className)}>
                    {INVOICE_STATUS_CONFIG[invoice.status]?.label || invoice.status}
                  </Badge>
                  <p className="font-medium text-sm whitespace-nowrap">
                    ¥{Number(invoice.total).toLocaleString()}
                  </p>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
            {invoices.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href={`/invoices?customerId=${customerId}`}>
                  查看全部 {invoices.length} 个发票
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
