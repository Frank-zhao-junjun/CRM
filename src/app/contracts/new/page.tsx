'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Plus, X, BarChart3, FileText, Briefcase, Building2, DollarSign, CalendarDays } from 'lucide-react';
import Link from 'next/link';

interface Opportunity {
  id: string;
  title: string;
  customerName: string;
  customerId: string;
  value: number;
}

interface Quote {
  id: string;
  title: string;
  customerName: string;
  customerId: string;
  total: number;
  opportunityId: string;
}

interface Customer {
  id: string;
  name: string;
  company: string;
}

interface MilestoneForm {
  name: string;
  description: string;
  expectedDate: string;
}

const DEFAULT_TERMS = `1. 甲方应按合同约定支付款项；
2. 乙方应按合同约定提供产品/服务；
3. 如有质量问题，甲方有权要求退换货；
4. 双方应遵守保密义务；
5. 如有争议，协商解决。`;

export default function NewContractPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [form, setForm] = useState({
    contractNumber: '',
    customerId: '',
    customerName: '',
    opportunityId: '',
    opportunityName: '',
    quoteId: '',
    quoteTitle: '',
    amount: 0,
    signingDate: '',
    effectiveDate: '',
    expirationDate: '',
    dueDate: '',
    terms: DEFAULT_TERMS,
    customTerms: '',
    notes: '',
  });
  
  const [milestones, setMilestones] = useState<MilestoneForm[]>([
    { name: '', description: '', expectedDate: '' },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [oppRes, quoteRes, custRes] = await Promise.all([
        fetch('/api/crm?type=opportunities'),
        fetch('/api/quotes?status=accepted'),
        fetch('/api/crm?type=customers'),
      ]);
      
      if (oppRes.ok) {
        const oppData = await oppRes.json();
        const activeOpps = oppData.filter((o: Record<string, unknown>) => 
          !['closed_won', 'closed_lost'].includes(o.stage as string)
        );
        setOpportunities(activeOpps.map((o: Record<string, unknown>) => ({
          id: o.id as string,
          title: o.title as string,
          customerName: o.customer_name as string,
          customerId: o.customer_id as string,
          value: Number(o.value),
        })));
      }
      
      if (quoteRes.ok) {
        const quoteData = await quoteRes.json();
        setQuotes(quoteData.map((q: Record<string, unknown>) => ({
          id: q.id as string,
          title: q.title as string,
          customerName: q.customer_name as string,
          customerId: q.customer_id as string,
          total: Number(q.total),
          opportunityId: q.opportunity_id as string,
        })));
      }

      if (custRes.ok) {
        const custData = await custRes.json();
        setCustomers(custData.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          name: c.name as string,
          company: c.company as string,
        })));
      }
    } catch { /* silent */ }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setForm(prev => ({
        ...prev,
        customerId,
        customerName: customer.company || customer.name,
        opportunityId: '',
        opportunityName: '',
        quoteId: '',
        quoteTitle: '',
      }));
    }
  };

  const handleQuoteSelect = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      const opp = opportunities.find(o => o.id === quote.opportunityId);
      setForm(prev => ({
        ...prev,
        quoteId,
        quoteTitle: quote.title,
        customerId: quote.customerId,
        customerName: quote.customerName,
        opportunityId: quote.opportunityId,
        opportunityName: opp?.title || '',
        amount: quote.total,
      }));
    }
  };

  const handleOpportunitySelect = (opportunityId: string) => {
    const opp = opportunities.find(o => o.id === opportunityId);
    if (opp) {
      setForm(prev => ({
        ...prev,
        opportunityId,
        opportunityName: opp.title,
        customerId: opp.customerId,
        customerName: opp.customerName,
        quoteId: '',
        quoteTitle: '',
        amount: opp.value,
      }));
      // Filter quotes for this opportunity
      const filteredQuotes = quotes.filter(q => q.opportunityId === opportunityId);
      if (filteredQuotes.length > 0) {
        const acceptedQuote = filteredQuotes[0];
        if (acceptedQuote) {
          setForm(prev => ({
            ...prev,
            quoteId: acceptedQuote.id,
            quoteTitle: acceptedQuote.title,
            amount: acceptedQuote.total,
          }));
        }
      }
    }
  };

  const updateMilestone = (index: number, field: keyof MilestoneForm, value: string) => {
    setMilestones(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMilestone = () => {
    setMilestones(prev => [...prev, { name: '', description: '', expectedDate: '' }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.customerId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            contractNumber: form.contractNumber || undefined,
            customerId: form.customerId,
            customerName: form.customerName,
            opportunityId: form.opportunityId || undefined,
            opportunityName: form.opportunityName || undefined,
            quoteId: form.quoteId || undefined,
            quoteTitle: form.quoteTitle || undefined,
            amount: form.amount,
            signingDate: form.signingDate || null,
            effectiveDate: form.effectiveDate || null,
            expirationDate: form.expirationDate || null,
            dueDate: form.dueDate || null,
            terms: form.terms,
            customTerms: form.customTerms || null,
            notes: form.notes || null,
            milestones: milestones.filter(m => m.name).map((m, idx) => ({
              name: m.name,
              description: m.description || null,
              expectedDate: m.expectedDate || null,
              sortOrder: idx,
            })),
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/contracts/${data.id}`);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contracts">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">新建合同</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="card-elevated border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" /> 基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label>客户 *</Label>
                <Select value={form.customerId} onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.company || c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quote/Opportunity Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>从报价单创建（可选）</Label>
                  <Select value={form.quoteId} onValueChange={handleQuoteSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择已接受的报价单" />
                    </SelectTrigger>
                    <SelectContent>
                      {quotes.map(quote => (
                        <SelectItem key={quote.id} value={quote.id}>
                          {quote.title} - ¥{(quote.total ?? 0).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>关联商机（可选）</Label>
                  <Select value={form.opportunityId} onValueChange={handleOpportunitySelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择商机" />
                    </SelectTrigger>
                    <SelectContent>
                      {opportunities.map(opp => (
                        <SelectItem key={opp.id} value={opp.id}>
                          {opp.title} ({opp.customerName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Customer Info Display */}
              {form.customerName && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-indigo-500/5 to-purple-500/5 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-500" />
                    <span className="text-muted-foreground">客户:</span>
                    <span className="text-foreground font-medium">{form.customerName}</span>
                  </div>
                  {form.quoteTitle && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">报价单:</span>
                      <span className="text-foreground font-medium">{form.quoteTitle}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Contract Number */}
              <div className="space-y-2">
                <Label>合同编号（留空自动生成）</Label>
                <Input
                  value={form.contractNumber}
                  onChange={e => setForm(prev => ({ ...prev, contractNumber: e.target.value }))}
                  placeholder="自动生成或手动输入"
                />
              </div>

              {/* Amount & Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>合同金额 *</Label>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="输入合同金额"
                  />
                </div>
                <div className="space-y-2">
                  <Label>签约日期</Label>
                  <Input
                    type="date"
                    value={form.signingDate}
                    onChange={e => setForm(prev => ({ ...prev, signingDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>生效日期</Label>
                  <Input
                    type="date"
                    value={form.effectiveDate}
                    onChange={e => setForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>到期日期</Label>
                  <Input
                    type="date"
                    value={form.expirationDate}
                    onChange={e => setForm(prev => ({ ...prev, expirationDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>预计回款日期</Label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card className="card-elevated border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-500" /> 履约节点配置
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={addMilestone}>
                  <Plus className="h-3 w-3" /> 添加节点
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>节点名称</TableHead>
                      <TableHead>说明</TableHead>
                      <TableHead className="w-[140px]">预计完成日期</TableHead>
                      <TableHead className="w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {milestones.map((milestone, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            value={milestone.name}
                            onChange={e => updateMilestone(idx, 'name', e.target.value)}
                            placeholder="如：预付款到账"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={milestone.description}
                            onChange={e => updateMilestone(idx, 'description', e.target.value)}
                            placeholder="节点描述"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={milestone.expectedDate}
                            onChange={e => updateMilestone(idx, 'expectedDate', e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          {milestones.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMilestone(idx)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          <Card className="card-elevated border-0">
            <CardHeader>
              <CardTitle>合同条款</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>标准条款</Label>
                <Textarea
                  value={form.terms}
                  onChange={e => setForm(prev => ({ ...prev, terms: e.target.value }))}
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>自定义条款</Label>
                <Textarea
                  value={form.customTerms}
                  onChange={e => setForm(prev => ({ ...prev, customTerms: e.target.value }))}
                  placeholder="添加额外的自定义条款（可选）"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="备注信息（可选）"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card className="card-elevated border-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
            <CardHeader className="relative"><CardTitle>合同摘要</CardTitle></CardHeader>
            <CardContent className="relative space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">客户</span>
                <span className="font-medium">{form.customerName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">关联报价单</span>
                <span className="font-medium">{form.quoteTitle || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">关联商机</span>
                <span className="font-medium">{form.opportunityName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">履约节点</span>
                <span className="font-medium">{milestones.filter(m => m.name).length} 个</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>合同金额</span>
                  <span className="text-indigo-600">¥{(form.amount ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="card-elevated border-0">
            <CardContent className="pt-6">
              <Button 
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20" 
                size="lg" 
                onClick={handleSubmit}
                disabled={loading || !form.customerId}
              >
                {loading ? '创建中...' : '创建合同'}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                创建后将生成唯一合同编号
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
