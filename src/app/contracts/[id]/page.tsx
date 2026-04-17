'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, BarChart3, Building2, Briefcase, FileText, Edit, Trash2, Calendar, CheckCircle, Play, Ban, AlertTriangle, DollarSign, Plus, Clock, TrendingUp, Receipt, CreditCard, X } from 'lucide-react';
import Link from 'next/link';
import { CONTRACT_STATUS_CONFIG, PAYMENT_STATUS_CONFIG, PAYMENT_METHOD_CONFIG, type Contract, type ContractStatus, type ContractMilestone, type PaymentReceipt, type PaymentMethod, type PaymentStatus } from '@/lib/crm-types';
import { format, isValid, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { cn } from '@/lib/utils';

function safeFormat(dateValue: string | null | undefined, fmt: string): string {
  if (!dateValue) return '-';
  const date = parseISO(dateValue);
  if (!isValid(date)) return '-';
  try { return format(date, fmt, { locale: zhCN }); } catch { return '-'; }
}

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [contract, setContract] = useState<Contract | null>(null);
  const [milestones, setMilestones] = useState<ContractMilestone[]>([]);
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer' as PaymentMethod,
    receiptNumber: '',
    remark: '',
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Edit payment dialog state
  const [editingPayment, setEditingPayment] = useState<PaymentReceipt | null>(null);
  const [editPaymentForm, setEditPaymentForm] = useState({
    amount: '',
    paymentDate: '',
    paymentMethod: 'bank_transfer' as PaymentMethod,
    receiptNumber: '',
    remark: '',
  });

  // Delete payment dialog state
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchContract();
  }, [id]);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const [contractRes, paymentsRes] = await Promise.all([
        fetch(`/api/contracts?id=${id}`),
        fetch(`/api/contracts/payments?contractId=${id}`),
      ]);

      if (contractRes.ok) {
        const data = await contractRes.json();
        setContract({
          id: data.id,
          contractNumber: data.contract_number,
          customerId: data.customer_id,
          customerName: data.customer_name,
          opportunityId: data.opportunity_id,
          opportunityName: data.opportunity_name,
          quoteId: data.quote_id,
          quoteTitle: data.quote_title,
          status: data.status as ContractStatus,
          amount: Number(data.amount),
          signingDate: data.signing_date,
          effectiveDate: data.effective_date,
          expirationDate: data.expiration_date,
          terms: data.terms,
          customTerms: data.custom_terms,
          paymentStatus: (data.payment_status as PaymentStatus) || 'unpaid',
          receivedAmount: Number(data.received_amount || 0),
          dueDate: data.due_date,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
        setMilestones((data.milestones || []).map((m: Record<string, unknown>) => ({
          id: m.id as string,
          contractId: m.contract_id as string,
          name: m.name as string,
          description: m.description as string | undefined,
          expectedDate: m.expected_date as string | undefined,
          completedDate: m.completed_date as string | undefined,
          isCompleted: m.is_completed as boolean,
          sortOrder: m.sort_order as number,
        })));
      }

      if (paymentsRes.ok) {
        const paymentData = await paymentsRes.json();
        setPayments(paymentData.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          contractId: p.contract_id as string,
          amount: Number(p.amount),
          paymentDate: p.payment_date as string,
          paymentMethod: (p.payment_method as PaymentMethod) || 'bank_transfer',
          receiptNumber: p.receipt_number as string | undefined,
          remark: p.remark as string | undefined,
          createdAt: p.created_at as string,
          updatedAt: p.updated_at as string,
        })));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleAction = async (action: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      });
      if (res.ok) {
        await fetchContract();
        setShowTerminateDialog(false);
      }
    } catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  const handleMilestoneToggle = async (milestoneId: string, isCompleted: boolean) => {
    try {
      await fetch('/api/contracts/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isCompleted ? 'complete' : 'update',
          data: { id: milestoneId, isCompleted: false }
        }),
      });
      await fetchContract();
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    try {
      await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      router.push('/contracts');
    } catch { /* silent */ }
  };

  // Payment handlers
  const handleAddPayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) return;
    setPaymentSubmitting(true);
    try {
      const res = await fetch('/api/contracts/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            contractId: id,
            amount: Number(paymentForm.amount),
            paymentDate: paymentForm.paymentDate,
            paymentMethod: paymentForm.paymentMethod,
            receiptNumber: paymentForm.receiptNumber || undefined,
            remark: paymentForm.remark || undefined,
          },
        }),
      });
      if (res.ok) {
        setShowPaymentDialog(false);
        setPaymentForm({
          amount: '',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'bank_transfer',
          receiptNumber: '',
          remark: '',
        });
        await fetchContract();
      }
    } catch { /* silent */ }
    finally { setPaymentSubmitting(false); }
  };

  const handleEditPayment = async () => {
    if (!editingPayment) return;
    setPaymentSubmitting(true);
    try {
      const res = await fetch('/api/contracts/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          data: {
            id: editingPayment.id,
            amount: Number(editPaymentForm.amount),
            paymentDate: editPaymentForm.paymentDate,
            paymentMethod: editPaymentForm.paymentMethod,
            receiptNumber: editPaymentForm.receiptNumber || undefined,
            remark: editPaymentForm.remark || undefined,
          },
        }),
      });
      if (res.ok) {
        setEditingPayment(null);
        await fetchContract();
      }
    } catch { /* silent */ }
    finally { setPaymentSubmitting(false); }
  };

  const handleDeletePayment = async () => {
    if (!deletePaymentId) return;
    try {
      await fetch('/api/contracts/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: deletePaymentId }),
      });
      setDeletePaymentId(null);
      await fetchContract();
    } catch { /* silent */ }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">加载中...</p></div>;
  }

  if (!contract) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">合同不存在</p></div>;
  }

  const statusConf = CONTRACT_STATUS_CONFIG[contract.status] || CONTRACT_STATUS_CONFIG.draft;
  const payConf = PAYMENT_STATUS_CONFIG[(contract.paymentStatus || 'unpaid') as keyof typeof PAYMENT_STATUS_CONFIG] || PAYMENT_STATUS_CONFIG.unpaid;
  const isEditable = contract.status === 'draft';
  const completedMilestones = milestones.filter(m => m.isCompleted).length;
  const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

  const receivedAmount = contract.receivedAmount || 0;
  const pendingAmount = contract.amount - receivedAmount;
  const paymentProgress = contract.amount > 0 ? (receivedAmount / contract.amount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/contracts')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{contract.contractNumber}</h1>
              <Badge className={cn(statusConf.className)}>{statusConf.label}</Badge>
              <Badge className={cn(payConf.className)}>{payConf.label}</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              创建于 {safeFormat(contract.createdAt, 'yyyy-MM-dd HH:mm')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isEditable && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/contracts/${id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" /> 编辑
                </Link>
              </Button>
              <Button onClick={() => handleAction('start')} className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20" disabled={actionLoading}>
                <Play className="h-4 w-4" /> 开始执行
              </Button>
            </>
          )}
          {contract.status === 'executing' && (
            <>
              <Button onClick={() => handleAction('complete')} className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20" disabled={actionLoading}>
                <CheckCircle className="h-4 w-4" /> 完成合同
              </Button>
              <Button variant="destructive" onClick={() => setShowTerminateDialog(true)} disabled={actionLoading}>
                <Ban className="h-4 w-4 mr-2" /> 终止合同
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Summary Card */}
          <Card className="card-elevated border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-green-500/5" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-indigo-500" /> 回款信息
                </CardTitle>
                {contract.status === 'executing' && (
                  <Button
                    size="sm"
                    className="gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                    onClick={() => setShowPaymentDialog(true)}
                  >
                    <Plus className="h-3 w-3" /> 登记回款
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-indigo-500/5 to-indigo-500/10">
                  <p className="text-xs text-muted-foreground mb-1">合同金额</p>
                  <p className="text-xl font-bold text-indigo-600">¥{(contract.amount ?? 0).toLocaleString()}</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/5 to-green-500/10">
                  <p className="text-xs text-muted-foreground mb-1">已回款</p>
                  <p className="text-xl font-bold text-green-600">¥{(receivedAmount ?? 0).toLocaleString()}</p>
                </div>
                <div className={cn(
                  "text-center p-4 rounded-xl",
                  pendingAmount > 0
                    ? "bg-gradient-to-br from-amber-500/5 to-amber-500/10"
                    : "bg-gradient-to-br from-gray-500/5 to-gray-500/10"
                )}>
                  <p className="text-xs text-muted-foreground mb-1">待回款</p>
                  <p className={cn("text-xl font-bold", pendingAmount > 0 ? "text-amber-600" : "text-gray-400")}>
                    ¥{(pendingAmount ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Payment Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">回款进度</span>
                  <span className="font-medium">{paymentProgress.toFixed(1)}%</span>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full transition-all duration-700",
                      paymentProgress >= 100
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : paymentProgress > 0
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                          : ""
                    )}
                    style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Records */}
          <Card className="card-elevated border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-green-500" /> 回款记录
                {payments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{payments.length} 笔</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <CreditCard className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">暂无回款记录</p>
                  {contract.status === 'executing' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 gap-1"
                      onClick={() => setShowPaymentDialog(true)}
                    >
                      <Plus className="h-3 w-3" /> 登记首笔回款
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold">回款日期</TableHead>
                        <TableHead className="text-right font-semibold">金额</TableHead>
                        <TableHead className="font-semibold">付款方式</TableHead>
                        <TableHead className="font-semibold">凭证号</TableHead>
                        <TableHead className="font-semibold">备注</TableHead>
                        <TableHead className="w-[80px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => {
                        const methodConf = PAYMENT_METHOD_CONFIG[payment.paymentMethod] || PAYMENT_METHOD_CONFIG.other;
                        return (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">
                              {safeFormat(payment.paymentDate, 'yyyy-MM-dd')}
                            </TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              ¥{(payment.amount ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {methodConf.icon} {methodConf.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {payment.receiptNumber || '-'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {payment.remark || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingPayment(payment);
                                    setEditPaymentForm({
                                      amount: String(payment.amount),
                                      paymentDate: payment.paymentDate ? payment.paymentDate.split('T')[0] : '',
                                      paymentMethod: payment.paymentMethod,
                                      receiptNumber: payment.receiptNumber || '',
                                      remark: payment.remark || '',
                                    });
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:text-red-600"
                                  onClick={() => setDeletePaymentId(payment.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Milestones */}
          {milestones.length > 0 && (
            <Card className="card-elevated border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-500" /> 履约进度
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {completedMilestones}/{milestones.length} 已完成
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Milestone List */}
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-all",
                        milestone.isCompleted
                          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900"
                          : "bg-muted/50 border-transparent"
                      )}
                    >
                      <button
                        onClick={() => contract.status === 'executing' && handleMilestoneToggle(milestone.id, !milestone.isCompleted)}
                        disabled={contract.status !== 'executing'}
                        className={cn(
                          "mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          milestone.isCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-muted-foreground hover:border-primary"
                        )}
                      >
                        {milestone.isCompleted && <CheckCircle className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={cn("font-medium", milestone.isCompleted && "line-through text-muted-foreground")}>
                            {milestone.name}
                          </p>
                          {milestone.expectedDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {safeFormat(milestone.expectedDate, 'yyyy-MM-dd')}
                            </span>
                          )}
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                        )}
                        {milestone.completedDate && (
                          <p className="text-xs text-green-600 mt-1">
                            已完成于 {safeFormat(milestone.completedDate, 'yyyy-MM-dd')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms */}
          {contract.terms && (
            <Card className="card-elevated border-0">
              <CardHeader><CardTitle>合同条款</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{contract.terms}</p>
              </CardContent>
            </Card>
          )}

          {contract.customTerms && (
            <Card className="card-elevated border-0">
              <CardHeader><CardTitle>自定义条款</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{contract.customTerms}</p>
              </CardContent>
            </Card>
          )}

          {contract.notes && (
            <Card className="card-elevated border-0">
              <CardHeader><CardTitle>备注</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contract Amount */}
          <Card className="card-elevated border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
            <CardHeader className="relative"><CardTitle>金额信息</CardTitle></CardHeader>
            <CardContent className="relative space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">合同金额</span>
                <span className="text-xl font-bold text-indigo-600">¥{(contract.amount ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">已回款</span>
                <span className="font-bold text-green-600">¥{(receivedAmount ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">待回款</span>
                <span className={cn("font-bold", pendingAmount > 0 ? "text-amber-600" : "text-muted-foreground")}>
                  ¥{(pendingAmount ?? 0).toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">回款状态</span>
                <Badge className={payConf.className}>{payConf.label}</Badge>
              </div>
              {contract.dueDate && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">预计回款日</span>
                  <span className={cn(
                    "font-medium",
                    contract.paymentStatus === 'overdue' && "text-red-600"
                  )}>
                    {safeFormat(contract.dueDate, 'yyyy-MM-dd')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="card-elevated border-0">
            <CardHeader><CardTitle>详细信息</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground">合同状态</span>
                <div className="mt-1"><Badge className={statusConf.className}>{statusConf.label}</Badge></div>
              </div>

              {/* Status Timeline */}
              <div className="flex items-center gap-1 my-3">
                {['draft', 'executing', 'completed'].map((step, idx) => {
                  const stepConf = CONTRACT_STATUS_CONFIG[step as ContractStatus];
                  const currentStep = CONTRACT_STATUS_CONFIG[contract.status]?.step ?? -1;
                  const isActive = stepConf.step <= currentStep && currentStep >= 0;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                        isActive
                          ? "bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {idx + 1}
                      </div>
                      {idx < 2 && (
                        <div className={cn(
                          "flex-1 h-0.5 mx-1",
                          isActive && CONTRACT_STATUS_CONFIG[['draft', 'executing', 'completed'][idx + 1] as ContractStatus]?.step <= currentStep
                            ? "bg-indigo-500"
                            : "bg-muted"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground -mt-1">
                <span>草稿</span>
                <span>执行中</span>
                <span>已完成</span>
              </div>

              <Separator />

              {contract.customerName && (
                <div>
                  <span className="text-muted-foreground">客户</span>
                  <div className="mt-1">
                    <Link href={`/customers/${contract.customerId}`} className="text-primary hover:underline flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" /> {contract.customerName}
                    </Link>
                  </div>
                </div>
              )}

              {contract.opportunityName && (
                <div>
                  <span className="text-muted-foreground">关联商机</span>
                  <div className="mt-1">
                    <Link href={`/opportunities/${contract.opportunityId}`} className="text-primary hover:underline flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {contract.opportunityName}
                    </Link>
                  </div>
                </div>
              )}

              {contract.quoteTitle && (
                <div>
                  <span className="text-muted-foreground">关联报价单</span>
                  <div className="mt-1">
                    <Link href={`/quotes/${contract.quoteId}`} className="text-primary hover:underline flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {contract.quoteTitle}
                    </Link>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <span className="text-muted-foreground">签约日期</span>
                <div className="mt-1 font-medium">
                  {contract.signingDate ? safeFormat(contract.signingDate, 'yyyy-MM-dd') : '-'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">生效日期</span>
                <div className="mt-1 font-medium">
                  {contract.effectiveDate ? safeFormat(contract.effectiveDate, 'yyyy-MM-dd') : '-'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">到期日期</span>
                <div className="mt-1 font-medium">
                  {contract.expirationDate ? safeFormat(contract.expirationDate, 'yyyy-MM-dd') : '-'}
                </div>
              </div>

              <Separator />

              <div>
                <span className="text-muted-foreground">履约节点</span>
                <div className="mt-1 font-medium">{milestones.length} 个</div>
              </div>
              <div>
                <span className="text-muted-foreground">已完成</span>
                <div className="mt-1 font-medium text-green-600">{completedMilestones} 个</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline
        entityId={contract.id}
        entityType="contract"
        showFilters={false}
        title={`关于合同 "${contract.contractNumber}" 的活动`}
      />

      {/* Delete Contract Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" /> 确认删除
            </DialogTitle>
            <DialogDescription>确定要删除这个合同吗？相关回款记录也将被删除，此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Contract Dialog */}
      <AlertDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" /> 确认终止合同
            </AlertDialogTitle>
            <AlertDialogDescription>
              终止合同后，将无法恢复。确定要终止这份合同吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction('terminate')} className="bg-orange-600 hover:bg-orange-700">
              确认终止
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" /> 登记回款
            </DialogTitle>
            <DialogDescription>
              合同金额: ¥{(contract.amount ?? 0).toLocaleString()}，待回款: ¥{(pendingAmount ?? 0).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>回款金额 *</Label>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="输入回款金额"
                />
              </div>
              <div className="space-y-2">
                <Label>回款日期 *</Label>
                <Input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={e => setPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>付款方式</Label>
                <Select value={paymentForm.paymentMethod} onValueChange={(v) => setPaymentForm(prev => ({ ...prev, paymentMethod: v as PaymentMethod }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_CONFIG).map(([key, conf]) => (
                      <SelectItem key={key} value={key}>
                        {conf.icon} {conf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>凭证号</Label>
                <Input
                  value={paymentForm.receiptNumber}
                  onChange={e => setPaymentForm(prev => ({ ...prev, receiptNumber: e.target.value }))}
                  placeholder="付款凭证编号（可选）"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={paymentForm.remark}
                onChange={e => setPaymentForm(prev => ({ ...prev, remark: e.target.value }))}
                placeholder="回款备注（可选）"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>取消</Button>
            <Button
              onClick={handleAddPayment}
              disabled={paymentSubmitting || !paymentForm.amount || Number(paymentForm.amount) <= 0}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
            >
              {paymentSubmitting ? '提交中...' : '确认回款'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={!!editingPayment} onOpenChange={() => setEditingPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" /> 编辑回款记录
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>回款金额</Label>
                <Input
                  type="number"
                  value={editPaymentForm.amount}
                  onChange={e => setEditPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>回款日期</Label>
                <Input
                  type="date"
                  value={editPaymentForm.paymentDate}
                  onChange={e => setEditPaymentForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>付款方式</Label>
                <Select value={editPaymentForm.paymentMethod} onValueChange={(v) => setEditPaymentForm(prev => ({ ...prev, paymentMethod: v as PaymentMethod }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHOD_CONFIG).map(([key, conf]) => (
                      <SelectItem key={key} value={key}>
                        {conf.icon} {conf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>凭证号</Label>
                <Input
                  value={editPaymentForm.receiptNumber}
                  onChange={e => setEditPaymentForm(prev => ({ ...prev, receiptNumber: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={editPaymentForm.remark}
                onChange={e => setEditPaymentForm(prev => ({ ...prev, remark: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPayment(null)}>取消</Button>
            <Button
              onClick={handleEditPayment}
              disabled={paymentSubmitting}
            >
              {paymentSubmitting ? '保存中...' : '保存更改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Dialog */}
      <Dialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" /> 确认删除回款记录
            </DialogTitle>
            <DialogDescription>删除后合同回款状态将自动更新，确定要删除吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePaymentId(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDeletePayment}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
