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
import { ArrowLeft, Package, CheckCircle, XCircle } from 'lucide-react';
import { ORDER_STATUS_CONFIG, type Order, type OrderStatus } from '@/lib/crm-types';
import { format } from 'date-fns';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder({
            id: data.id,
            quoteId: data.quote_id,
            opportunityId: data.opportunity_id,
            customerId: data.customer_id,
            orderNumber: data.order_number,
            status: data.status as OrderStatus,
            orderDate: data.order_date,
            deliveryDate: data.delivery_date,
            subtotal: Number(data.subtotal),
            tax: Number(data.tax),
            total: Number(data.total),
            notes: data.notes,
            items: (data.items || []).map((i: Record<string, unknown>) => ({
              id: i.id as string,
              orderId: i.order_id as string,
              productName: i.product_name as string,
              description: i.description as string | undefined,
              quantity: Number(i.quantity),
              unitPrice: Number(i.unit_price),
              subtotal: Number(i.subtotal),
              sortOrder: i.sort_order as number,
            })),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
        }
      } catch { /* silent */ }
    };
    if (id) fetchOrder();
  }, [id]);

  const handleAction = async (action: string) => {
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data: { id } }),
      });
      // Refresh
      const res = await fetch(`/api/orders?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(prev => prev ? { ...prev, status: data.status as OrderStatus } : prev);
      }
    } catch { /* silent */ }
  };

  if (!order) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">加载中...</p></div>;
  }

  const statusConf = ORDER_STATUS_CONFIG[order.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-mono">{order.orderNumber}</h1>
            <p className="text-muted-foreground text-sm mt-1">创建于 {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusConf.className}>{statusConf.label}</Badge>
          {order.status === 'pending' && (
            <Button onClick={() => handleAction('confirm')} className="gap-2"><CheckCircle className="h-4 w-4" /> 确认订单</Button>
          )}
          {order.status === 'confirmed' && (
            <Button onClick={() => handleAction('fulfill')} className="gap-2 bg-green-600 hover:bg-green-700"><CheckCircle className="h-4 w-4" /> 完成订单</Button>
          )}
          {(order.status === 'pending' || order.status === 'confirmed') && (
            <Button variant="destructive" onClick={() => handleAction('cancel')} className="gap-2"><XCircle className="h-4 w-4" /> 取消</Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> 订单明细</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品名称</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                    <TableHead className="text-right">单价</TableHead>
                    <TableHead className="text-right">小计</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(order.items || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">¥{item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">¥{item.subtotal.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>金额汇总</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">小计</span><span>¥{order.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">税额</span><span>¥{order.tax.toLocaleString()}</span></div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg"><span>总计</span><span className="text-primary">¥{order.total.toLocaleString()}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>订单信息</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">订单编号</span><div className="mt-1 font-mono">{order.orderNumber}</div></div>
              <div><span className="text-muted-foreground">状态</span><div className="mt-1"><Badge className={statusConf.className}>{statusConf.label}</Badge></div></div>
              {order.orderDate && <div><span className="text-muted-foreground">订单日期</span><div className="mt-1">{format(new Date(order.orderDate), 'yyyy-MM-dd')}</div></div>}
              {order.deliveryDate && <div><span className="text-muted-foreground">交付日期</span><div className="mt-1">{format(new Date(order.deliveryDate), 'yyyy-MM-dd')}</div></div>}
              {order.notes && <div><span className="text-muted-foreground">备注</span><div className="mt-1 whitespace-pre-wrap">{order.notes}</div></div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
