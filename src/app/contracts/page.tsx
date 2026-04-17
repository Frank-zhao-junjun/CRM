'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, FileText, Trash2, Building2, Briefcase, BarChart3, DollarSign, AlertTriangle, Clock, TrendingUp, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { CONTRACT_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, type Contract, type ContractStatus } from '@/lib/crm-types';
import { format, isValid, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

function safeFormat(dateValue: string | null | undefined, fmt: string): string {
  if (!dateValue) return '-';
  const date = parseISO(dateValue);
  if (!isValid(date)) return '-';
  try { return format(date, fmt, { locale: zhCN }); } catch { return '-'; }
}

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; company: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
    fetchCustomers();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts');
      if (res.ok) {
        const data = await res.json();
        setContracts(data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          contractNumber: c.contract_number as string,
          customerId: c.customer_id as string | undefined,
          customerName: c.customer_name as string | undefined,
          opportunityId: c.opportunity_id as string | undefined,
          opportunityName: c.opportunity_name as string | undefined,
          quoteId: c.quote_id as string | undefined,
          quoteTitle: c.quote_title as string | undefined,
          status: c.status as ContractStatus,
          amount: Number(c.amount),
          signingDate: c.signing_date as string | undefined,
          effectiveDate: c.effective_date as string | undefined,
          expirationDate: c.expiration_date as string | undefined,
          terms: c.terms as string | undefined,
          customTerms: c.custom_terms as string | undefined,
          paymentStatus: (c.payment_status as string) || 'unpaid',
          receivedAmount: Number(c.received_amount || 0),
          dueDate: c.due_date as string | undefined,
          notes: c.notes as string | undefined,
          createdAt: c.created_at as string,
          updatedAt: c.updated_at as string,
        })));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/crm?type=customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          company: c.company as string,
        })));
      }
    } catch { /* silent */ }
  };

  const filteredContracts = contracts.filter(c => {
    const matchSearch = !search ||
      c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
      (c.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchCustomer = customerFilter === 'all' || c.customerId === customerFilter;
    const matchDateFrom = !dateFrom || (c.signingDate && new Date(c.signingDate) >= new Date(dateFrom));
    const matchDateTo = !dateTo || (c.signingDate && new Date(c.signingDate) <= new Date(dateTo + 'T23:59:59'));
    return matchSearch && matchStatus && matchCustomer && matchDateFrom && matchDateTo;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: deleteId }),
      });
      setDeleteId(null);
      fetchContracts();
    } catch { /* silent */ }
  };

  const stats = {
    total: contracts.length,
    draft: contracts.filter(c => c.status === 'draft').length,
    executing: contracts.filter(c => c.status === 'executing').length,
    completed: contracts.filter(c => c.status === 'completed').length,
    terminated: contracts.filter(c => c.status === 'terminated').length,
    totalAmount: contracts.reduce((s, c) => s + c.amount, 0),
    receivedAmount: contracts.reduce((s, c) => s + (c.receivedAmount || 0), 0),
    pendingAmount: contracts.reduce((s, c) => s + (c.amount - (c.receivedAmount || 0)), 0),
    overdueCount: contracts.filter(c => c.paymentStatus === 'overdue').length,
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setCustomerFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = search || statusFilter !== 'all' || customerFilter !== 'all' || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="section-title text-xl">合同管理</h1>
          <p className="text-muted-foreground mt-1">共 {filteredContracts.length} 个合同</p>
        </div>
        <Button onClick={() => router.push('/contracts/new')} className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/20">
          <Plus className="h-4 w-4" /> 新建合同
        </Button>
      </div>

      {/* Stats - PRO MAX Style */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="card-elevated border-0 relative overflow-hidden cursor-pointer group" onClick={() => setStatusFilter('all')}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
          <CardContent className="relative p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">全部合同</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated border-0 relative overflow-hidden cursor-pointer group" onClick={() => setStatusFilter('executing')}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
          <CardContent className="relative p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">执行中</p>
                <p className="text-2xl font-bold text-blue-600">{stats.executing}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated border-0 relative overflow-hidden cursor-pointer group" onClick={() => setStatusFilter('completed')}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent" />
          <CardContent className="relative p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">已回款</p>
                <p className="text-lg font-bold text-green-600">¥{(stats.receivedAmount ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated border-0 relative overflow-hidden cursor-pointer group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
          <CardContent className="relative p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">待回款</p>
                <p className="text-lg font-bold text-amber-600">¥{(stats.pendingAmount ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated border-0 relative overflow-hidden cursor-pointer group" onClick={() => setStatusFilter('draft')}>
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
          <CardContent className="relative p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">逾期</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索合同编号或客户..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="executing">执行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="terminated">已终止</SelectItem>
          </SelectContent>
        </Select>
        <Select value={customerFilter} onValueChange={setCustomerFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="客户筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部客户</SelectItem>
            {customers.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.company || c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-[140px]"
            placeholder="起始日期"
          />
          <span className="text-muted-foreground text-sm">至</span>
          <Input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-[140px]"
            placeholder="结束日期"
          />
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            清除筛选
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredContracts.length === 0 ? (
        <Card className="card-elevated border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1">暂无合同</h3>
            <p className="text-sm text-muted-foreground mb-4">开始创建你的第一个合同</p>
            <Button onClick={() => router.push('/contracts/new')} className="gap-2">
              <Plus className="h-4 w-4" /> 新建合同
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-elevated border-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">合同编号</TableHead>
                <TableHead className="font-semibold">客户</TableHead>
                <TableHead className="font-semibold">合同状态</TableHead>
                <TableHead className="font-semibold">回款状态</TableHead>
                <TableHead className="text-right font-semibold">合同金额</TableHead>
                <TableHead className="text-right font-semibold">已回款</TableHead>
                <TableHead className="font-semibold">签约日期</TableHead>
                <TableHead className="font-semibold">到期日</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => {
                const statusConf = CONTRACT_STATUS_CONFIG[contract.status] || CONTRACT_STATUS_CONFIG.draft;
                const payConf = PAYMENT_STATUS_CONFIG[(contract.paymentStatus || 'unpaid') as keyof typeof PAYMENT_STATUS_CONFIG] || PAYMENT_STATUS_CONFIG.unpaid;
                const isOverdue = contract.paymentStatus === 'overdue';
                return (
                  <TableRow
                    key={contract.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      isOverdue && "bg-red-50/50 dark:bg-red-950/10"
                    )}
                    onClick={() => router.push(`/contracts/${contract.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
                        </div>
                        <span className="font-medium">{contract.contractNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contract.customerName ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {contract.customerName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(statusConf.className, "text-xs")}>
                        {statusConf.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(payConf.className, "text-xs")}>
                        {payConf.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ¥{(contract.amount ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-medium",
                      (contract.receivedAmount || 0) >= contract.amount && contract.amount > 0
                        ? "text-green-600"
                        : (contract.receivedAmount || 0) > 0
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    )}>
                      ¥{(contract.receivedAmount ?? 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contract.signingDate ? safeFormat(contract.signingDate, 'yyyy-MM-dd') : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {contract.expirationDate ? (
                        <span className={cn(
                          isOverdue && "text-red-600 font-medium"
                        )}>
                          {safeFormat(contract.expirationDate, 'yyyy-MM-dd')}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={e => { e.stopPropagation(); setDeleteId(contract.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" /> 确认删除
            </DialogTitle>
            <DialogDescription>确定要删除这个合同吗？相关回款记录也将被删除，此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
