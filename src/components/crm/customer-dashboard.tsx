'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  FileText, 
  ShoppingCart, 
  FileSignature, 
  Receipt,
  Loader2,
  CheckSquare,
  AlertCircle,
  DollarSign,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CustomerStats {
  quotesCount: number;
  quotesTotal: number;
  ordersCount: number;
  ordersTotal: number;
  paidOrdersTotal: number;
  awaitingPaymentTotal: number;
  contractsCount: number;
  contractsTotal: number;
  invoicesCount: number;
  invoicesTotal: number;
  paidInvoicesTotal: number;
  pendingInvoicesTotal: number;
  tasksCount: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
}

interface Quote {
  id: string;
  total: number;
  status: string;
}

interface Order {
  id: string;
  total: number;
  status: string;
}

interface Contract {
  id: string;
  amount: number;
  status: string;
}

interface Invoice {
  id: string;
  total: number;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  due_date?: string;
}

interface CustomerDashboardProps {
  customerId: string;
  customerName: string;
  className?: string;
}

export function CustomerDashboard({ customerId, customerName, className }: CustomerDashboardProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [quotesRes, ordersRes, contractsRes, invoicesRes, tasksRes] = await Promise.all([
        fetch(`/api/crm?type=quotes&customerId=${customerId}`),
        fetch(`/api/crm?type=orders&customerId=${customerId}`),
        fetch(`/api/crm?type=contracts&customerId=${customerId}`),
        fetch(`/api/crm?type=invoices&customerId=${customerId}`),
        fetch(`/api/crm?type=tasks&customerId=${customerId}`),
      ]);

      const [quotesData, ordersData, contractsData, invoicesData, tasksData] = await Promise.all([
        quotesRes.ok ? quotesRes.json() : [],
        ordersRes.ok ? ordersRes.json() : [],
        contractsRes.ok ? contractsRes.json() : [],
        invoicesRes.ok ? invoicesRes.json() : [],
        tasksRes.ok ? tasksRes.json() : [],
      ]);

      setQuotes(Array.isArray(quotesData) ? quotesData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setContracts(Array.isArray(contractsData) ? contractsData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo<CustomerStats>(() => {
    const quotesTotal = quotes.reduce((sum, q) => sum + Number(q.total), 0);
    const ordersTotal = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const paidOrdersTotal = orders
      .filter(o => ['paid', 'completed'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total), 0);
    const awaitingPaymentTotal = orders
      .filter(o => ['confirmed', 'awaiting_payment'].includes(o.status))
      .reduce((sum, o) => sum + Number(o.total), 0);
    const contractsTotal = contracts.reduce((sum, c) => sum + Number(c.amount), 0);
    const invoicesTotal = invoices.reduce((sum, i) => sum + Number(i.total), 0);
    const paidInvoicesTotal = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.total), 0);
    const pendingInvoicesTotal = invoices
      .filter(i => ['issued', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + Number(i.total), 0);
    const pendingTasksCount = tasks.filter(t => t.status === 'pending').length;
    const overdueTasksCount = tasks.filter(t => 
      t.status !== 'completed' && t.status !== 'cancelled' && 
      t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date))
    ).length;

    return {
      quotesCount: quotes.length,
      quotesTotal,
      ordersCount: orders.length,
      ordersTotal,
      paidOrdersTotal,
      awaitingPaymentTotal,
      contractsCount: contracts.length,
      contractsTotal,
      invoicesCount: invoices.length,
      invoicesTotal,
      paidInvoicesTotal,
      pendingInvoicesTotal,
      tasksCount: tasks.length,
      pendingTasksCount,
      overdueTasksCount,
    };
  }, [quotes, orders, contracts, invoices, tasks]);

  if (loading) {
    return (
      <Card className={cn('card-hover', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 关键指标卡片 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* 总订单金额 */}
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总订单金额</p>
                <p className="text-lg font-semibold">¥{stats.ordersTotal.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{stats.ordersCount} 个订单</span>
              <span>·</span>
              <span className="text-green-600 dark:text-green-400">已收 ¥{stats.paidOrdersTotal.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* 总合同金额 */}
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                <FileSignature className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总合同金额</p>
                <p className="text-lg font-semibold">¥{stats.contractsTotal.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{stats.contractsCount} 个合同</span>
            </div>
          </CardContent>
        </Card>

        {/* 待回款金额 */}
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10">
                <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">待回款金额</p>
                <p className="text-lg font-semibold">¥{(stats.awaitingPaymentTotal + stats.pendingInvoicesTotal).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>订单待回 ¥{stats.awaitingPaymentTotal.toLocaleString()}</span>
              <span>·</span>
              <span>发票待收 ¥{stats.pendingInvoicesTotal.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* 已回款金额 */}
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
                <Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已回款金额</p>
                <p className="text-lg font-semibold">¥{stats.paidInvoicesTotal.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{stats.invoicesCount} 个发票</span>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400">已收 ¥{stats.paidInvoicesTotal.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 业务数据统计 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {/* 报价单数 */}
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-muted-foreground">报价单</span>
              </div>
              <Badge variant="secondary">{stats.quotesCount}</Badge>
            </div>
            <p className="text-lg font-semibold mt-2">¥{stats.quotesTotal.toLocaleString()}</p>
          </CardContent>
        </Card>

        {/* 订单数 */}
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm text-muted-foreground">订单</span>
              </div>
              <Badge variant="secondary">{stats.ordersCount}</Badge>
            </div>
            <p className="text-lg font-semibold mt-2">¥{stats.ordersTotal.toLocaleString()}</p>
          </CardContent>
        </Card>

        {/* 合同数 */}
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-muted-foreground">合同</span>
              </div>
              <Badge variant="secondary">{stats.contractsCount}</Badge>
            </div>
            <p className="text-lg font-semibold mt-2">¥{stats.contractsTotal.toLocaleString()}</p>
          </CardContent>
        </Card>

        {/* 发票数 */}
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="text-sm text-muted-foreground">发票</span>
              </div>
              <Badge variant="secondary">{stats.invoicesCount}</Badge>
            </div>
            <p className="text-lg font-semibold mt-2">¥{stats.invoicesTotal.toLocaleString()}</p>
          </CardContent>
        </Card>

        {/* 任务数 */}
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm text-muted-foreground">任务</span>
              </div>
              <Badge variant={stats.overdueTasksCount > 0 ? 'destructive' : 'secondary'}>
                {stats.tasksCount}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {stats.pendingTasksCount > 0 && (
                <span className="text-xs text-muted-foreground">{stats.pendingTasksCount} 待处理</span>
              )}
              {stats.overdueTasksCount > 0 && (
                <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {stats.overdueTasksCount} 逾期
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
