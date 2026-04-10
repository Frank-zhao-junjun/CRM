'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Search, Package, Trash2, MoreVertical, X, CheckCircle, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ORDER_STATUS_CONFIG, type Order, type OrderStatus } from '@/lib/crm-types';
import { format } from 'date-fns';

interface OrderItemForm {
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    opportunityId: '',
    customerId: '',
    orderDate: '',
    deliveryDate: '',
    notes: '',
  });
  const [createItems, setCreateItems] = useState<OrderItemForm[]>([
    { productName: '', description: '', quantity: 1, unitPrice: 0, subtotal: 0 },
  ]);

  // Options
  const [opportunities, setOpportunities] = useState<{ id: string; title: string; customerId: string; customerName: string }[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.map((o: Record<string, unknown>) => ({
          id: o.id,
          quoteId: o.quote_id as string | undefined,
          opportunityId: o.opportunity_id as string,
          customerId: o.customer_id as string,
          orderNumber: o.order_number as string,
          status: o.status as OrderStatus,
          orderDate: o.order_date as string | undefined,
          deliveryDate: o.delivery_date as string | undefined,
          subtotal: Number(o.subtotal),
          tax: Number(o.tax),
          total: Number(o.total),
          notes: o.notes as string | undefined,
          createdAt: o.created_at as string,
          updatedAt: o.updated_at as string,
        })));
      }
    } catch { /* silent */ }
  };

  const fetchOptions = async () => {
    try {
      const [oppRes, custRes] = await Promise.all([
        fetch('/api/crm?type=opportunities'),
        fetch('/api/crm?type=customers'),
      ]);
      if (oppRes.ok) {
        const data = await oppRes.json();
        setOpportunities(data.map((o: Record<string, unknown>) => ({
          id: o.id, title: o.title as string, customerId: o.customer_id as string, customerName: o.customer_name as string,
        })));
      }
      if (custRes.ok) {
        const data = await custRes.json();
        setCustomers(data.map((c: Record<string, unknown>) => ({ id: c.id, name: c.name as string })));
      }
    } catch { /* silent */ }
  };

  useEffect(() => { fetchOrders(); fetchOptions(); }, []);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    const subtotal = createItems.reduce((sum, i) => sum + i.subtotal, 0);
    const tax = subtotal * 0.06;
    const total = subtotal + tax;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            opportunityId: createForm.opportunityId,
            customerId: createForm.customerId,
            orderDate: createForm.orderDate || null,
            deliveryDate: createForm.deliveryDate || null,
            subtotal,
            tax,
            total,
            notes: createForm.notes,
            items: createItems.filter(i => i.productName).map(i => ({
              productName: i.productName,
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              subtotal: i.subtotal,
            })),
          },
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setCreateForm({ opportunityId: '', customerId: '', orderDate: '', deliveryDate: '', notes: '' });
        setCreateItems([{ productName: '', description: '', quantity: 1, unitPrice: 0, subtotal: 0 }]);
        fetchOrders();
      }
    } catch { /* silent */ }
  };

  const handleAction = async (action: string, id: string) => {
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data: { id } }),
      });
      fetchOrders();
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/orders?id=${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchOrders();
    } catch { /* silent */ }
  };

  const updateItem = (index: number, field: keyof OrderItemForm, value: string | number) => {
    setCreateItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (['quantity', 'unitPrice'].includes(field)) {
        const q = field === 'quantity' ? Number(value) : updated[index].quantity;
        const p = field === 'unitPrice' ? Number(value) : updated[index].unitPrice;
        updated[index].subtotal = q * p;
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">成交订单</h1>
          <p className="text-muted-foreground mt-1">管理已成交的订单</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600">
          <Plus className="h-4 w-4" />
          新建订单
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索订单号..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="筛选状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">暂无订单</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> 新建订单
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单编号</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>订单日期</TableHead>
                  <TableHead>交付日期</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const statusConf = ORDER_STATUS_CONFIG[order.status];
                  return (
                    <TableRow key={order.id} className="group cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                      <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                      <TableCell><Badge className={statusConf.className}>{statusConf.label}</Badge></TableCell>
                      <TableCell className="font-medium">¥{order.total.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{order.orderDate ? format(new Date(order.orderDate), 'yyyy/MM/dd') : '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{order.deliveryDate ? format(new Date(order.deliveryDate), 'yyyy/MM/dd') : '-'}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {order.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleAction('confirm', order.id)} className="gap-2">
                                <CheckCircle className="h-4 w-4" /> 确认订单
                              </DropdownMenuItem>
                            )}
                            {order.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => handleAction('fulfill', order.id)} className="gap-2">
                                <CheckCircle className="h-4 w-4" /> 完成订单
                              </DropdownMenuItem>
                            )}
                            {(order.status === 'pending' || order.status === 'confirmed') && (
                              <DropdownMenuItem onClick={() => handleAction('cancel', order.id)} className="gap-2 text-red-600">
                                <XCircle className="h-4 w-4" /> 取消订单
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setDeleteId(order.id)} className="gap-2 text-red-600">
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
            <DialogTitle>新建订单</DialogTitle>
            <DialogDescription>手动创建成交订单</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>关联机会 *</Label>
                <Select value={createForm.opportunityId} onValueChange={v => {
                  const opp = opportunities.find(o => o.id === v);
                  setCreateForm(prev => ({ ...prev, opportunityId: v, customerId: opp?.customerId || prev.customerId }));
                }}>
                  <SelectTrigger><SelectValue placeholder="选择商机" /></SelectTrigger>
                  <SelectContent>
                    {opportunities.map(o => <SelectItem key={o.id} value={o.id}>{o.title} ({o.customerName})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>关联客户 *</Label>
                <Select value={createForm.customerId} onValueChange={v => setCreateForm(prev => ({ ...prev, customerId: v }))}>
                  <SelectTrigger><SelectValue placeholder="选择客户" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>订单日期</Label><Input type="date" value={createForm.orderDate} onChange={e => setCreateForm(prev => ({ ...prev, orderDate: e.target.value }))} /></div>
              <div className="space-y-2"><Label>交付日期</Label><Input type="date" value={createForm.deliveryDate} onChange={e => setCreateForm(prev => ({ ...prev, deliveryDate: e.target.value }))} /></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>订单明细</Label>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setCreateItems(prev => [...prev, { productName: '', description: '', quantity: 1, unitPrice: 0, subtotal: 0 }])}>
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
                        <TableCell className="font-medium">¥{item.subtotal.toLocaleString()}</TableCell>
                        <TableCell>
                          {createItems.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCreateItems(prev => prev.filter((_, i) => i !== idx))}><X className="h-3 w-3" /></Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="text-right text-sm space-y-1">
                <p>小计: ¥{createItems.reduce((s, i) => s + i.subtotal, 0).toLocaleString()}</p>
                <p>税额(6%): ¥{(createItems.reduce((s, i) => s + i.subtotal, 0) * 0.06).toFixed(2)}</p>
                <p className="text-lg font-bold">总计: ¥{(createItems.reduce((s, i) => s + i.subtotal, 0) * 1.06).toFixed(2)}</p>
              </div>
            </div>
            <div className="space-y-2"><Label>备注</Label><Textarea value={createForm.notes} onChange={e => setCreateForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="备注信息" rows={2} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!createForm.opportunityId || !createForm.customerId} className="bg-gradient-to-r from-green-500 to-emerald-600">创建订单</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-red-500" /> 确认删除</DialogTitle>
            <DialogDescription>确定要删除这个订单吗？此操作不可撤销。</DialogDescription>
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
