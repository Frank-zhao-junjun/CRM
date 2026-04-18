'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface Order {
  id: string;
  order_number: string;
  status: 'draft' | 'confirmed' | 'awaiting_payment' | 'paid' | 'completed' | 'cancelled';
  total: number;
  order_date?: string;
  created_at: string;
  updated_at: string;
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; className: string; color: string }> = {
  draft: { label: '草稿', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', color: 'text-gray-600 dark:text-gray-400' },
  confirmed: { label: '已确认', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400' },
  awaiting_payment: { label: '待付款', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', color: 'text-orange-600 dark:text-orange-400' },
  paid: { label: '已付款', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', color: 'text-green-600 dark:text-green-400' },
  completed: { label: '已完成', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', color: 'text-emerald-600 dark:text-emerald-400' },
  cancelled: { label: '已取消', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', color: 'text-red-600 dark:text-red-400' },
};

interface CustomerOrdersCardProps {
  customerId: string;
  className?: string;
}

export function CustomerOrdersCard({ customerId, className }: CustomerOrdersCardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm?type=orders&customerId=${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10">
            <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          订单
          {orders.length > 0 && (
            <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
          )}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/orders/new?customerId=${customerId}`}>
            添加
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">暂无订单</p>
            <Button variant="link" size="sm" asChild className="mt-2">
              <Link href={`/orders/new?customerId=${customerId}`}>
                创建订单
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.order_date 
                      ? format(new Date(order.order_date), 'yyyy/MM/dd', { locale: zhCN })
                      : format(new Date(order.created_at), 'yyyy/MM/dd', { locale: zhCN })
                    }
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <Badge variant="outline" className={cn('text-xs', ORDER_STATUS_CONFIG[order.status]?.className)}>
                    {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
                  </Badge>
                  <p className="font-medium text-sm whitespace-nowrap">
                    ¥{Number(order.total).toLocaleString()}
                  </p>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
            {orders.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href={`/orders?customerId=${customerId}`}>
                  查看全部 {orders.length} 个订单
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
