'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Send, ArrowRight, FileText, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { QUOTE_STATUS_CONFIG, type Quote, type QuoteStatus } from '@/lib/crm-types';
import { format } from 'date-fns';

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/quotes?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setQuote({
            id: data.id,
            opportunityId: data.opportunity_id,
            title: data.title,
            status: data.status as QuoteStatus,
            validFrom: data.valid_from,
            validUntil: data.valid_until,
            subtotal: Number(data.subtotal),
            discount: Number(data.discount),
            tax: Number(data.tax),
            total: Number(data.total),
            terms: data.terms,
            notes: data.notes,
            items: (data.items || []).map((i: Record<string, unknown>) => ({
              id: i.id as string,
              quoteId: i.quote_id as string,
              productName: i.product_name as string,
              description: i.description as string | undefined,
              quantity: Number(i.quantity),
              unitPrice: Number(i.unit_price),
              discount: Number(i.discount),
              subtotal: Number(i.subtotal),
              sortOrder: i.sort_order as number,
            })),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
        }
      } catch { /* silent */ }
    };
    if (id) fetchQuote();
  }, [id]);

  const handleAction = async (action: string) => {
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      });
      if (res.ok) {
        if (action === 'convertToOrder') {
          router.push('/orders');
        } else {
          // Refresh
          const data = await res.json();
          setQuote(prev => prev ? { ...prev, status: data.status } : prev);
        }
      }
    } catch { /* silent */ }
  };

  if (!quote) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">加载中...</p></div>;
  }

  const statusConf = QUOTE_STATUS_CONFIG[quote.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/quotes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{quote.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">创建于 {format(new Date(quote.createdAt), 'yyyy-MM-dd HH:mm')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusConf.className}>{statusConf.label}</Badge>
          {quote.status === 'draft' && (
            <Button onClick={() => handleAction('send')} className="gap-2">
              <Send className="h-4 w-4" /> 发送报价
            </Button>
          )}
          {quote.status === 'active' && (
            <>
              <Button onClick={() => handleAction('accept')} className="gap-2 bg-green-600 hover:bg-green-700">接受</Button>
              <Button variant="destructive" onClick={() => handleAction('reject')}>拒绝</Button>
            </>
          )}
          {quote.status === 'accepted' && (
            <Button onClick={() => handleAction('convertToOrder')} className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600">
              <ArrowRight className="h-4 w-4" /> 转为订单
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> 报价明细</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品名称</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                    <TableHead className="text-right">单价</TableHead>
                    <TableHead className="text-right">折扣</TableHead>
                    <TableHead className="text-right">小计</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(quote.items || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">¥{item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.discount > 0 ? `-¥${item.discount.toLocaleString()}` : '-'}</TableCell>
                      <TableCell className="text-right font-medium">¥{item.subtotal.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Terms */}
          {quote.terms && (
            <Card>
              <CardHeader><CardTitle>条款说明</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{quote.terms}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader><CardTitle>金额汇总</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">小计</span><span>¥{quote.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">折扣</span><span>-¥{quote.discount.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">税额</span><span>¥{quote.tax.toLocaleString()}</span></div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg"><span>总计</span><span className="text-primary">¥{quote.total.toLocaleString()}</span></div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader><CardTitle>详细信息</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">状态</span><div className="mt-1"><Badge className={statusConf.className}>{statusConf.label}</Badge></div></div>
              <div>
                <span className="text-muted-foreground">关联销售机会</span>
                <div className="mt-1">
                  <Link href={`/opportunities/${quote.opportunityId}`} className="text-primary hover:underline flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> 查看销售机会
                  </Link>
                </div>
              </div>
              {quote.validFrom && <div><span className="text-muted-foreground">有效期开始</span><div className="mt-1">{format(new Date(quote.validFrom), 'yyyy-MM-dd')}</div></div>}
              {quote.validUntil && <div><span className="text-muted-foreground">有效期结束</span><div className="mt-1">{format(new Date(quote.validUntil), 'yyyy-MM-dd')}</div></div>}
              {quote.notes && <div><span className="text-muted-foreground">备注</span><div className="mt-1 whitespace-pre-wrap">{quote.notes}</div></div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
