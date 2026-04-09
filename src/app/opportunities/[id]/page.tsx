'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, DollarSign, Building2, Calendar, User, FileText } from 'lucide-react';
import Link from 'next/link';
import { OpportunityStage } from '@/lib/crm-types';
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

const stageLabels: Record<OpportunityStage, { label: string; className: string }> = {
  lead: { label: '线索', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  qualified: { label: 'qualified', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  proposal: { label: '提案', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  negotiation: { label: '谈判', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  closed_won: { label: '成交', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  closed_lost: { label: '失败', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { opportunities, deleteOpportunity } = useCRM();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const opportunity = opportunities.find(o => o.id === params.id);

  if (!opportunity) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">销售机会不存在</p>
      </div>
    );
  }

  const handleDelete = () => {
    deleteOpportunity(opportunity.id);
    router.push('/opportunities');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/opportunities">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{opportunity.title}</h2>
            <p className="text-muted-foreground">{opportunity.customerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/opportunities/${opportunity.id}/edit`}>
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
        {/* 机会详情 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>机会详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">机会名称</p>
                <p className="font-medium">{opportunity.title}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">当前阶段</p>
                <Badge variant="outline" className={cn(stageLabels[opportunity.stage].className)}>
                  {stageLabels[opportunity.stage].label}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">金额</p>
                  <p className="font-medium">¥{opportunity.value.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">预计成交</p>
                  <p className="font-medium">
                    {format(new Date(opportunity.expectedCloseDate), 'yyyy/MM/dd', { locale: zhCN })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">成交概率</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${opportunity.probability}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{opportunity.probability}%</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">客户</p>
                <Link 
                  href={`/customers/${opportunity.customerId}`}
                  className="text-sm text-primary hover:underline"
                >
                  {opportunity.customerName}
                </Link>
              </div>
            </div>

            {opportunity.contactName && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">联系人</p>
                  <p className="text-sm">{opportunity.contactName}</p>
                </div>
              </div>
            )}

            {opportunity.description && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">描述</p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{opportunity.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 销售漏斗进度 */}
        <Card>
          <CardHeader>
            <CardTitle>销售漏斗</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['lead', 'qualified', 'proposal', 'negotiation', 'closed_won'].map((stage, index) => {
              const stageData = stageLabels[stage as OpportunityStage];
              const isActive = opportunity.stage === stage;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive && "text-primary"
                    )}>
                      {stageData.label}
                    </p>
                  </div>
                  {isActive && (
                    <Badge variant="secondary">当前</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* 元信息 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>创建时间: {format(new Date(opportunity.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
            <span>更新时间: {format(new Date(opportunity.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除销售机会 &ldquo;{opportunity.title}&rdquo; 吗？此操作不可撤销。
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
