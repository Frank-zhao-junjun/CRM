'use client';

import React, { useState, useMemo } from 'react';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, DollarSign, AlertTriangle, CheckCircle, Clock, Search, TrendingUp, Building2, Calendar } from 'lucide-react';

interface PaymentDisplay {
  id: string;
  customerId: string;
  customerName: string;
  opportunityId: string;
  opportunityName: string;
  amount: number;
  paidAmount: number;
  status: 'pending' | 'partial' | 'completed' | 'overdue';
  dueDate: string;
}

export default function PaymentsPage() {
  const { opportunities } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDisplay | null>(null);
  const [recordAmount, setRecordAmount] = useState('');

  // 从商机中提取回款数据
  const payments = useMemo<PaymentDisplay[]>(() => {
    return opportunities
      .filter(opp => ['negotiation', 'closed_won'].includes(opp.stage))
      .map(opp => {
        const isOverdue = opp.expectedCloseDate && new Date(opp.expectedCloseDate) < new Date() && opp.stage !== 'closed_won';
        return {
          id: opp.id,
          customerId: opp.customerId,
          customerName: opp.customerName,
          opportunityId: opp.id,
          opportunityName: opp.title,
          amount: opp.value,
          paidAmount: opp.stage === 'closed_won' ? opp.value : 0,
          status: opp.stage === 'closed_won' ? 'completed' : isOverdue ? 'overdue' : 'pending',
          dueDate: opp.expectedCloseDate || new Date().toISOString().split('T')[0],
        };
      });
  }, [opportunities]);

  // 计算统计数据
  const stats = useMemo(() => {
    const totalReceivable = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalReceived = payments.reduce((sum, p) => sum + p.paidAmount, 0);
    const overduePayments = payments.filter(p => p.status === 'overdue');
    const totalOverdue = overduePayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);
    
    return {
      totalReceivable,
      totalReceived,
      totalOverdue,
      overdueCount: overduePayments.length,
      pendingCount: payments.filter(p => p.status === 'pending').length,
      completedCount: payments.filter(p => p.status === 'completed').length,
      collectionRate: totalReceivable > 0 ? (totalReceived / totalReceivable) * 100 : 0,
      overdueRate: totalReceivable > 0 ? (totalOverdue / totalReceivable) * 100 : 0,
    };
  }, [payments]);

  // 筛选回款计划
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.opportunityName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    return filtered;
  }, [payments, searchTerm, statusFilter]);

  const handleRecordPayment = (payment: PaymentDisplay) => {
    setSelectedPayment(payment);
    setRecordAmount('');
    setShowRecordDialog(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">回款管理</h1>
          <p className="text-muted-foreground">管理和追踪客户回款情况</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">应收总额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.totalReceivable.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已回款</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{stats.totalReceived.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.collectionRate.toFixed(1)}% 回款率</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">逾期金额</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">¥{stats.totalOverdue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.overdueCount} 笔逾期</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待回款</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">笔待回款</p>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索客户或项目..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待回款</SelectItem>
            <SelectItem value="partial">部分回款</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="overdue">逾期</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 回款列表 */}
      <Card>
        <CardHeader>
          <CardTitle>回款计划列表</CardTitle>
          <CardDescription>共 {filteredPayments.length} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无回款计划
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{payment.customerName}</span>
                      {payment.status === 'overdue' && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          逾期
                        </Badge>
                      )}
                      {payment.status === 'completed' && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          已回款
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {payment.opportunityName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {payment.dueDate}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">¥{(payment.amount - payment.paidAmount).toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">/ ¥{payment.amount.toLocaleString()}</span>
                      </div>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${(payment.paidAmount / payment.amount) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    {payment.status !== 'completed' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleRecordPayment(payment)}
                      >
                        登记回款
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 登记回款对话框 */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>登记回款</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>客户</Label>
                <div className="font-medium">{selectedPayment.customerName}</div>
              </div>
              <div className="space-y-2">
                <Label>项目</Label>
                <div className="font-medium">{selectedPayment.opportunityName}</div>
              </div>
              <div className="space-y-2">
                <Label>待回金额</Label>
                <div className="font-medium text-lg">
                  ¥{(selectedPayment.amount - selectedPayment.paidAmount).toLocaleString()}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">回款金额</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="请输入回款金额"
                  value={recordAmount}
                  onChange={(e) => setRecordAmount(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordDialog(false)}>
              取消
            </Button>
            <Button onClick={() => setShowRecordDialog(false)}>
              确认登记
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
