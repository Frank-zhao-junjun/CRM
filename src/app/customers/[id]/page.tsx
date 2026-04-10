'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Globe, MapPin, FileText } from 'lucide-react';
import Link from 'next/link';
import { CustomerStatus } from '@/lib/crm-types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const statusLabels: Record<CustomerStatus, { label: string; className: string }> = {
  active: { label: '活跃', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  inactive: { label: '非活跃', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  prospect: { label: '潜在客户', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { customers, contacts, opportunities, deleteCustomer } = useCRM();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const customer = customers.find(c => c.id === params.id);
  const customerContacts = contacts.filter(c => c.customerId === params.id);
  const customerOpportunities = opportunities.filter(o => o.customerId === params.id);

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">客户不存在</p>
      </div>
    );
  }

  const handleDelete = () => {
    deleteCustomer(customer.id);
    router.push('/customers');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            <p className="text-muted-foreground">{customer.company}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/customers/${customer.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            删除
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 基本信息 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">客户名称</p>
                <p className="font-medium">{customer.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">公司名称</p>
                <p className="font-medium">{customer.company}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">状态</p>
                <Badge variant="outline" className={cn(statusLabels[customer.status].className)}>
                  {statusLabels[customer.status].label}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">行业</p>
                <p className="font-medium">{customer.industry || '-'}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">邮箱</p>
                  <p className="text-sm">{customer.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">电话</p>
                  <p className="text-sm">{customer.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">网站</p>
                  <p className="text-sm">{customer.website || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">地址</p>
                  <p className="text-sm">{customer.address || '-'}</p>
                </div>
              </div>
            </div>

            {customer.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">备注</p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 客户联系人 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>联系人</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/contacts/new?customerId=${customer.id}`}>
                添加
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {customerContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无联系人</p>
            ) : (
              <div className="space-y-4">
                {customerContacts.map(contact => (
                  <div key={contact.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {contact.lastName}{contact.firstName}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {contact.lastName}{contact.firstName}
                        {contact.isPrimary && (
                          <Badge variant="secondary" className="ml-2 text-xs">主要</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{contact.position}</p>
                      <p className="text-xs text-muted-foreground">{contact.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 商机 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>商机</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/opportunities/new?customerId=${customer.id}`}>
              添加
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {customerOpportunities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">暂无商机</p>
          ) : (
            <div className="space-y-4">
              {customerOpportunities.map(opp => (
                <div key={opp.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{opp.title}</p>
                    <p className="text-sm text-muted-foreground">
                      预计 {format(new Date(opp.expectedCloseDate), 'yyyy/MM/dd', { locale: zhCN })} 截止
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-medium">¥{opp.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{opp.probability}% 概率</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 元信息 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>创建时间: {format(new Date(customer.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
            <span>更新时间: {format(new Date(customer.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除客户 &ldquo;{customer.name}&rdquo; 吗？此操作不可撤销，将同时删除相关的联系人和商机。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
