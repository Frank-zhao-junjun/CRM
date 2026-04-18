'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Quote {
  id: string;
  title: string;
  status: 'draft' | 'active' | 'accepted' | 'rejected' | 'expired';
  total: number;
  valid_until?: string;
  created_at: string;
  updated_at: string;
}

const QUOTE_STATUS_CONFIG: Record<string, { label: string; className: string; color: string }> = {
  draft: { label: '草稿', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', color: 'text-gray-600 dark:text-gray-400' },
  active: { label: '已发送', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400' },
  accepted: { label: '已接受', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', color: 'text-green-600 dark:text-green-400' },
  rejected: { label: '已拒绝', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', color: 'text-red-600 dark:text-red-400' },
  expired: { label: '已过期', className: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20', color: 'text-stone-600 dark:text-stone-400' },
};

interface CustomerQuotesCardProps {
  customerId: string;
  className?: string;
}

export function CustomerQuotesCard({ customerId, className }: CustomerQuotesCardProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm?type=quotes&customerId=${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(Array.isArray(data) ? data : []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          报价单
          {quotes.length > 0 && (
            <Badge variant="secondary" className="ml-1">{quotes.length}</Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/quotes/new?customerId=${customerId}`}>
            添加
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">暂无报价单</p>
            <Button variant="link" size="sm" asChild className="mt-2">
              <Link href={`/quotes/new?customerId=${customerId}`}>
                创建报价单
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.slice(0, 5).map((quote) => (
              <Link
                key={quote.id}
                href={`/quotes/${quote.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{quote.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(quote.created_at), 'yyyy/MM/dd', { locale: zhCN })}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Badge variant="outline" className={cn('text-xs', QUOTE_STATUS_CONFIG[quote.status]?.className)}>
                    {QUOTE_STATUS_CONFIG[quote.status]?.label || quote.status}
                  </Badge>
                  <p className="font-medium text-sm whitespace-nowrap">
                    ¥{Number(quote.total).toLocaleString()}
                  </p>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
            {quotes.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href={`/quotes?customerId=${customerId}`}>
                  查看全部 {quotes.length} 个报价单
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
