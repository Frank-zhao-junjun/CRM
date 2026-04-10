'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, FileText, Trash2, Send, ArrowRight, MoreVertical, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { QUOTE_STATUS_CONFIG, type Quote, type QuoteStatus } from '@/lib/crm-types';
import { format } from 'date-fns';

interface QuoteItemForm {
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

interface OpportunityOption {
  id: string;
  title: string;
  customerName: string;
}

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityOption[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    opportunityId: '',
    title: '',
    validFrom: '',
    validUntil: '',
    terms: '',
    notes: '',
  });
  const [createItems, setCreateItems] = useState<QuoteItemForm[]>([
    { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 },
  ]);

  const fetchQuotes = async () => {
    try {
      const res = await fetch('/api/quotes');
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.map((q: Record<string, unknown>) => ({
          id: q.id,
          opportunityId: q.opportunity_id as string,
          title: q.title as string,
          status: q.status as QuoteStatus,
          validFrom: q.valid_from as string | undefined,
          validUntil: q.valid_until as string | undefined,
          subtotal: Number(q.subtotal),
          discount: Number(q.discount),
          tax: Number(q.tax),
          total: Number(q.total),
          terms: q.terms as string | undefined,
          notes: q.notes as string | undefined,
          createdAt: q.created_at as string,
          updatedAt: q.updated_at as string,
        })));
      }
    } catch { /* silent */ }
  };

  const fetchOpportunities = async () => {
    try {
      const res = await fetch('/api/crm?type=opportunities');
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.map((o: Record<string, unknown>) => ({
          id: o.id,
          title: o.title as string,
          customerName: o.customer_name as string,
        })));
      }
    } catch { /* silent */ }
  };

  useEffect(() => { fetchQuotes(); fetchOpportunities(); }, []);

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    const subtotal = createItems.reduce((sum, i) => sum + i.subtotal, 0);
    const discount = createItems.reduce((sum, i) => sum + i.discount, 0);
    const taxRate = 0.06;
    const tax = (subtotal - discount) * taxRate;
    const total = subtotal - discount + tax;

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            opportunityId: createForm.opportunityId,
            title: createForm.title,
            validFrom: createForm.validFrom || null,
            validUntil: createForm.validUntil || null,
            subtotal,
            discount,
            tax,
            total,
            terms: createForm.terms,
            notes: createForm.notes,
            items: createItems.filter(i => i.productName).map(i => ({
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
        setShowCreate(false);
        setCreateForm({ opportunityId: '', title: '', validFrom: '', validUntil: '', terms: '', notes: '' });
        setCreateItems([{ productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 }]);
        fetchQuotes();
      }
    } catch { /* silent */ }
  };

  const handleAction = async (action: string, id: string) => {
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data: { id } }),
      });
      if (res.ok) {
        if (action === 'convertToOrder') {
          await res.json();
          router.push(`/orders`);
        }
        fetchQuotes();
      }
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/quotes?id=${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchQuotes();
    } catch { /* silent */ }
  };

  const updateItem = (index: number, field: keyof QuoteItemForm, value: string | number) => {
    setCreateItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Recalculate subtotal
      if (['quantity', 'unitPrice', 'discount'].includes(field)) {
        const q = field === 'quantity' ? Number(value) : updated[index].quantity;
        const p = field === 'unitPrice' ? Number(value) : updated[index].unitPrice;
        const d = field === 'discount' ? Number(value) : updated[index].discount;
        updated[index].subtotal = q * p - d;
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">报价单管理</h1>
          <p className="text-muted-foreground mt-1">管理销售过程中的报价单</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gradient-to-r from-primary to-purple-600">
          <Plus className="h-4 w-4" />
          新建报价单
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索报价单..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {Object.entries(QUOTE_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quotes Table */}
      <Card>
        <CardContent className="p-0">
          {filteredQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">暂无报价单</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> 新建报价单
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>报价单标题</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>有效期至</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => {
                  const statusConf = QUOTE_STATUS_CONFIG[quote.status];
                  return (
                    <TableRow key={quote.id} className="group cursor-pointer" onClick={() => router.push(`/quotes/${quote.id}`)}>
                      <TableCell className="font-medium">{quote.title}</TableCell>
                      <TableCell>
                        <Badge className={statusConf.className}>{statusConf.label}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">¥{quote.total.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {quote.validUntil ? format(new Date(quote.validUntil), 'yyyy/MM/dd') : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(quote.createdAt), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {quote.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleAction('send', quote.id)} className="gap-2">
                                <Send className="h-4 w-4" /> 发送报价
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleAction('accept', quote.id)} className="gap-2 text-green-600">
                                标记已接受
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleAction('reject', quote.id)} className="gap-2 text-red-600">
                                标记已拒绝
                              </DropdownMenuItem>
                            )}
                            {quote.status === 'accepted' && (
                              <DropdownMenuItem onClick={() => handleAction('convertToOrder', quote.id)} className="gap-2">
                                <ArrowRight className="h-4 w-4" /> 转为订单
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeleteId(quote.id)} className="gap-2 text-red-600">
                              <Trash2 className="h-4 w-4" /> 删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建报价单</DialogTitle>
            <DialogDescription>为销售机会创建报价单</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>关联机会 *</Label>
                <Select value={createForm.opportunityId} onValueChange={v => setCreateForm(prev => ({ ...prev, opportunityId: v }))}>
                  <SelectTrigger><SelectValue placeholder="选择销售机会" /></SelectTrigger>
                  <SelectContent>
                    {opportunities.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.title} ({o.customerName})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>报价单标题 *</Label>
                <Input value={createForm.title} onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))} placeholder="输入报价单标题" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>有效开始日期</Label>
                <Input type="date" value={createForm.validFrom} onChange={e => setCreateForm(prev => ({ ...prev, validFrom: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>有效结束日期</Label>
                <Input type="date" value={createForm.validUntil} onChange={e => setCreateForm(prev => ({ ...prev, validUntil: e.target.value }))} />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>报价明细</Label>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setCreateItems(prev => [...prev, { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 }])}>
                  <Plus className="h-3 w-3" /> 添加
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品名称</TableHead>
                      <TableHead className="w-[80px]">数量</TableHead>
                      <TableHead className="w-[120px]">单价</TableHead>
                      <TableHead className="w-[80px]">折扣</TableHead>
                      <TableHead className="w-[100px]">小计</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {createItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell><Input value={item.productName} onChange={e => updateItem(idx, 'productName', e.target.value)} placeholder="产品名称" className="h-8" /></TableCell>
                        <TableCell><Input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="h-8" min={1} /></TableCell>
                        <TableCell><Input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} className="h-8" min={0} /></TableCell>
                        <TableCell><Input type="number" value={item.discount} onChange={e => updateItem(idx, 'discount', Number(e.target.value))} className="h-8" min={0} /></TableCell>
                        <TableCell className="font-medium">¥{item.subtotal.toLocaleString()}</TableCell>
                        <TableCell>
                          {createItems.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCreateItems(prev => prev.filter((_, i) => i !== idx))}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="text-right text-sm space-y-1">
                <p>小计: ¥{createItems.reduce((s, i) => s + i.subtotal, 0).toLocaleString()}</p>
                <p>折扣: -¥{createItems.reduce((s, i) => s + i.discount, 0).toLocaleString()}</p>
                <p>税额(6%): ¥{((createItems.reduce((s, i) => s + i.subtotal, 0) - createItems.reduce((s, i) => s + i.discount, 0)) * 0.06).toFixed(2)}</p>
                <p className="text-lg font-bold">总计: ¥{((createItems.reduce((s, i) => s + i.subtotal, 0) - createItems.reduce((s, i) => s + i.discount, 0)) * 1.06).toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>条款说明</Label>
              <Textarea value={createForm.terms} onChange={e => setCreateForm(prev => ({ ...prev, terms: e.target.value }))} placeholder="付款条款、交付方式等" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea value={createForm.notes} onChange={e => setCreateForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="备注信息" rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!createForm.opportunityId || !createForm.title} className="bg-gradient-to-r from-primary to-purple-600">
              保存草稿
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" /> 确认删除
            </DialogTitle>
            <DialogDescription>确定要删除这个报价单吗？此操作不可撤销。</DialogDescription>
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
