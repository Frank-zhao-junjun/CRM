'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ArrowLeft, Plus, X, Package, FileText, Building2, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { type Quote, QUOTE_STATUS_CONFIG } from '@/lib/crm-types';

interface OrderItemForm {
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

interface Opportunity {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  stage: string;
}

interface Quote {
  id: string;
  title: string;
  quoteNumber?: string;
  customerName?: string;
  opportunityId: string;
  opportunityName?: string;
  status: string;
  total: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('fromQuote');
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [form, setForm] = useState({
    quoteId: quoteId || '',
    opportunityId: '',
    customerName: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'cash' | 'credit_card' | 'other',
    notes: '',
  });
  const [items, setItems] = useState<OrderItemForm[]>([
    { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch accepted quotes for selection
        const quotesRes = await fetch('/api/quotes');
        if (quotesRes.ok) {
          const data = await quotesRes.json();
          const acceptedQuotes = data
            .filter((q: Record<string, unknown>) => q.status === 'accepted')
            .map((q: Record<string, unknown>) => ({
              id: q.id as string,
              title: q.title as string,
              quoteNumber: (q as Record<string, unknown>).quote_number as string || `QT-${(q.id as string).slice(0, 8).toUpperCase()}`,
              customerName: q.customer_name as string | undefined,
              opportunityId: q.opportunity_id as string,
              opportunityName: (q as Record<string, unknown>).opportunity_name as string | undefined,
              status: q.status as string,
              total: Number(q.total),
            }));
          setQuotes(acceptedQuotes);
        }

        // Fetch opportunities for selection
        const oppRes = await fetch('/api/crm?type=opportunities');
        if (oppRes.ok) {
          const data = await oppRes.json();
          setOpportunities(data.map((o: Record<string, unknown>) => ({
            id: o.id as string,
            title: o.title as string,
            customerId: o.customer_id as string,
            customerName: o.customer_name as string,
            stage: o.stage as string,
          })));
        }

        // If coming from a quote, fetch that quote's details
        if (quoteId) {
          const quoteRes = await fetch(`/api/quotes?id=${quoteId}`);
          if (quoteRes.ok) {
            const data = await quoteRes.json();
            const quote = {
              id: data.id,
              title: data.title,
              quoteNumber: `QT-${data.id.slice(0, 8).toUpperCase()}`,
              customerName: data.customer_name,
              opportunityId: data.opportunity_id,
              opportunityName: (data as Record<string, unknown>).opportunity_name as string | undefined,
              status: data.status,
              total: Number(data.total),
            };
            setForm(prev => ({
              ...prev,
              quoteId: data.id,
              opportunityId: data.opportunity_id,
              customerName: data.customer_name || '',
            }));
            // Import items from quote
            if (data.items && data.items.length > 0) {
              setItems(data.items.map((i: Record<string, unknown>) => ({
                productName: i.product_name as string,
                description: (i.description as string) || '',
                quantity: Number(i.quantity),
                unitPrice: Number(i.unit_price),
                discount: Number(i.discount) || 0,
                subtotal: Number(i.subtotal),
              })));
            }
          }
        }
      } catch { /* silent */ }
    };
    fetchData();
  }, [quoteId]);

  const selectedQuote = quotes.find(q => q.id === form.quoteId);

  const updateItem = (index: number, field: keyof OrderItemForm, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (['quantity', 'unitPrice', 'discount'].includes(field)) {
        const q = field === 'quantity' ? Number(value) : updated[index].quantity;
        const p = field === 'unitPrice' ? Number(value) : updated[index].unitPrice;
        const d = field === 'discount' ? Number(value) : updated[index].discount;
        updated[index].subtotal = q * p - d;
      }
      return updated;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalDiscount = items.reduce((sum, i) => sum + i.discount, 0);
  const taxRate = 0.06;
  const tax = (subtotal - totalDiscount) * taxRate;
  const total = subtotal - totalDiscount + tax;

  const handleSubmit = async () => {
    if (!form.opportunityId || items.filter(i => i.productName).length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            quoteId: form.quoteId || null,
            opportunityId: form.opportunityId,
            orderDate: form.orderDate || null,
            deliveryDate: form.deliveryDate || null,
            paymentMethod: form.paymentMethod,
            subtotal,
            discount: totalDiscount,
            tax,
            total,
            notes: form.notes,
            items: items.filter(i => i.productName).map(i => ({
              productName: i.productName,
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount,
              subtotal: i.subtotal,
            })),
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/orders/${data.id}`);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold">新建订单</h2>
          <p className="text-muted-foreground text-sm">
            {quoteId ? '从报价单创建订单' : '手动创建成交订单'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> 从报价单创建（可选）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>选择已接受的报价单</Label>
                <Select value={form.quoteId} onValueChange={v => {
                  const quote = quotes.find(q => q.id === v);
                  if (quote) {
                    setForm(prev => ({
                      ...prev,
                      quoteId: v,
                      opportunityId: quote.opportunityId,
                      customerName: quote.customerName || '',
                    }));
                    // Note: In a real app, we would also fetch quote items here
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="从已接受的报价单中选择，或留空手动创建" />
                  </SelectTrigger>
                  <SelectContent>
                    {quotes.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        暂无可用的报价单
                      </div>
                    ) : (
                      quotes.map(q => (
                        <SelectItem key={q.id} value={q.id}>
                          <div className="flex items-center gap-2">
                            <span>{q.quoteNumber || q.id.slice(0, 8)}</span>
                            <span className="text-muted-foreground">- {q.title}</span>
                            <span className="font-medium ml-auto">¥{q.total.toLocaleString()}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedQuote && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      已选择报价单: {selectedQuote.title} | 客户: {selectedQuote.customerName || '未知'} | 金额: ¥{selectedQuote.total.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> 订单信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>关联商机 *</Label>
                  <Select value={form.opportunityId} onValueChange={v => {
                    const opp = opportunities.find(o => o.id === v);
                    setForm(prev => ({
                      ...prev,
                      opportunityId: v,
                      customerName: opp?.customerName || prev.customerName,
                    }));
                  }}>
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
                <div className="space-y-2">
                  <Label>客户名称</Label>
                  <Input value={form.customerName} onChange={e => setForm(prev => ({ ...prev, customerName: e.target.value }))} placeholder="客户名称" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>订单日期</Label>
                  <Input type="date" value={form.orderDate} onChange={e => setForm(prev => ({ ...prev, orderDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>预计交付日期</Label>
                  <Input type="date" value={form.deliveryDate} onChange={e => setForm(prev => ({ ...prev, deliveryDate: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>付款方式</Label>
                <Select value={form.paymentMethod} onValueChange={v => setForm(prev => ({ ...prev, paymentMethod: v as typeof form.paymentMethod }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">银行转账</SelectItem>
                    <SelectItem value="cash">现金</SelectItem>
                    <SelectItem value="credit_card">信用卡</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> 订单明细
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>产品明细</Label>
                <Button variant="outline" size="sm" className="gap-1" onClick={addItem}>
                  <Plus className="h-3 w-3" /> 添加产品
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品名称</TableHead>
                      <TableHead className="w-[80px]">数量</TableHead>
                      <TableHead className="w-[100px]">单价</TableHead>
                      <TableHead className="w-[80px]">折扣</TableHead>
                      <TableHead className="w-[100px]">小计</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input 
                            value={item.productName} 
                            onChange={e => updateItem(idx, 'productName', e.target.value)} 
                            placeholder="产品名称" 
                            className="h-8" 
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} 
                            className="h-8" 
                            min={1} 
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.unitPrice} 
                            onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} 
                            className="h-8" 
                            min={0} 
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            value={item.discount} 
                            onChange={e => updateItem(idx, 'discount', Number(e.target.value))} 
                            className="h-8" 
                            min={0} 
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          ¥{item.subtotal.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {items.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(idx)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="flex justify-end">
                <div className="text-right space-y-1 w-64">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">小计:</span>
                    <span>¥{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">折扣:</span>
                    <span className="text-red-500">-¥{totalDiscount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">税额(6%):</span>
                    <span>¥{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>总计:</span>
                    <span className="text-primary">¥{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>备注</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={form.notes} 
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} 
                placeholder="订单备注信息..." 
                rows={3} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={handleSubmit} 
                disabled={!form.opportunityId || items.filter(i => i.productName).length === 0 || loading}
                className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {loading ? '创建中...' : '创建订单'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/orders')}>
                取消
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">订单状态流程</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-muted-foreground">草稿</span>
                </div>
                <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4" />
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">已确认</span>
                </div>
                <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4" />
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-muted-foreground">待付款</span>
                </div>
                <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4" />
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">已付款</span>
                </div>
                <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4" />
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-600" />
                  <span className="text-muted-foreground">已完成</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
