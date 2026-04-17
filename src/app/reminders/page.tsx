'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BellRing,
  Plus,
  Search,
  Calendar,
  DollarSign,
  FileCheck,
  Lightbulb,
  Trash2,
  Eye,
  ExternalLink,
  RefreshCw,
  Zap,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  REMINDER_TYPE_CONFIG,
  type CRMReminder,
  type ReminderType,
  type ReminderStatus,
} from '@/lib/crm-types';
import { ReminderCreateDialog } from '@/components/crm/reminder-create-dialog';

function safeFormat(dateValue: string | null | undefined, fmt: string): string {
  if (!dateValue) return '-';
  const date = parseISO(dateValue);
  if (!isValid(date)) return '-';
  try { return format(date, fmt, { locale: zhCN }); } catch { return '-'; }
}

// ============ Type Config for Icons ============

const typeIconMap: Record<string, typeof Clock> = {
  task_due: Clock,
  opp_stage_timeout: AlertTriangle,
  lead_timeout: Lightbulb,
  contract_milestone: FileCheck,
  payment_due: DollarSign,
  custom: BellRing,
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: '待触发', color: 'text-blue-600', bg: 'bg-blue-500/10', icon: Clock },
  triggered: { label: '已触发', color: 'text-orange-600', bg: 'bg-orange-500/10', icon: BellRing },
  completed: { label: '已完成', color: 'text-green-600', bg: 'bg-green-500/10', icon: CheckCircle2 },
  dismissed: { label: '已忽略', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: XCircle },
};

// ============ Component ============

export default function RemindersPage() {
  const router = useRouter();
  const [reminders, setReminders] = useState<CRMReminder[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, triggered: 0, completed: 0, overdue: 0, today: 0 });
  const [tab, setTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      let statusFilter: string | undefined;
      if (tab === 'today') statusFilter = undefined; // handled client-side
      else if (tab === 'overdue') statusFilter = undefined; // handled client-side
      else if (tab === 'pending') statusFilter = 'pending';
      else if (tab === 'triggered') statusFilter = 'triggered';
      else if (tab === 'completed') statusFilter = 'completed';

      const [remindersRes, statsRes] = await Promise.all([
        fetch(`/api/reminders?action=list${statusFilter ? `&status=${statusFilter}` : ''}`),
        fetch('/api/reminders?action=stats'),
      ]);

      if (remindersRes.ok) {
        const data = await remindersRes.json();
        let filtered = data.map(mapReminder);

        // Client-side filters
        if (tab === 'today') {
          const now = new Date();
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          filtered = filtered.filter((r: CRMReminder) => {
            const d = new Date(r.remindAt);
            return d >= startOfDay && d < endOfDay && r.status !== 'dismissed';
          });
        } else if (tab === 'overdue') {
          const now = new Date();
          filtered = filtered.filter((r: CRMReminder) =>
            new Date(r.remindAt) < now && r.status === 'pending'
          );
        }

        // Type filter
        if (typeFilter !== 'all') {
          filtered = filtered.filter((r: CRMReminder) => r.type === typeFilter);
        }

        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          filtered = filtered.filter((r: CRMReminder) =>
            r.title.toLowerCase().includes(q) ||
            (r.message || '').toLowerCase().includes(q) ||
            (r.entityName || '').toLowerCase().includes(q)
          );
        }

        setReminders(filtered);
      }

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch {
      toast.error('加载提醒数据失败');
    } finally {
      setLoading(false);
    }
  }, [tab, typeFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) throw new Error();
      const actionLabels: Record<string, string> = {
        complete: '完成',
        dismiss: '忽略',
        markRead: '已读',
      };
      toast.success(`已标记为${actionLabels[action] || action}`);
      fetchData();
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('提醒已删除');
      fetchData();
    } catch {
      toast.error('删除失败');
    }
  };

  const handleSmartDetect = async () => {
    try {
      const res = await fetch('/api/reminders?action=smart-detect');
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`智能检测完成，新增 ${data.created} 条提醒`);
      fetchData();
    } catch {
      toast.error('智能检测失败');
    }
  };

  const handleTriggerDue = async () => {
    try {
      const res = await fetch('/api/reminders?action=trigger');
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`已触发 ${data.triggered} 条到期提醒`);
      fetchData();
    } catch {
      toast.error('触发提醒失败');
    }
  };

  const navigateToEntity = (reminder: CRMReminder) => {
    if (!reminder.entityType || !reminder.entityId) return;
    const routeMap: Record<string, string> = {
      customer: `/customers/${reminder.entityId}`,
      lead: `/leads/${reminder.entityId}`,
      opportunity: `/opportunities/${reminder.entityId}`,
      contract: `/contracts/${reminder.entityId}`,
      task: `/tasks/${reminder.entityId}`,
    };
    const route = routeMap[reminder.entityType];
    if (route) router.push(route);
  };

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-red-500/5 rounded-3xl -z-10" />
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="section-title text-xl">智能提醒</h1>
            <p className="text-muted-foreground mt-1">
              跟踪任务、商机、合同、回款等重要时间节点
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleTriggerDue}>
              <Zap className="h-4 w-4" />
              触发到期
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleSmartDetect}>
              <RefreshCw className="h-4 w-4" />
              智能检测
            </Button>
            <Button
              onClick={() => setShowCreate(true)}
              className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/25"
            >
              <Plus className="h-4 w-4" />
              新建提醒
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '待处理', value: stats.pending + stats.triggered, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-800' },
          { label: '今日提醒', value: stats.today, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800' },
          { label: '已逾期', value: stats.overdue, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-800' },
          { label: '已完成', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-200 dark:border-green-800' },
          { label: '全部', value: stats.total, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950/20', border: 'border-gray-200 dark:border-gray-800' },
        ].map(stat => (
          <Card key={stat.label} className={cn('border', stat.border)}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs + Filters */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="pending">待触发</TabsTrigger>
            <TabsTrigger value="triggered">
              已触发
              {stats.triggered > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-4 min-w-[16px] p-0 text-[10px]">
                  {stats.triggered}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="today">今日</TabsTrigger>
            <TabsTrigger value="overdue">
              已逾期
              {stats.overdue > 0 && (
                <Badge variant="destructive" className="ml-1.5 h-4 min-w-[16px] p-0 text-[10px]">
                  {stats.overdue}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 h-9 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {Object.entries(REMINDER_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="搜索提醒..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 w-48 h-9 text-xs"
              />
            </div>
          </div>
        </div>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reminders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <BellRing className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground">暂无提醒</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  点击「新建提醒」或「智能检测」自动发现待提醒事项
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {reminders.map(reminder => {
                const typeConf = REMINDER_TYPE_CONFIG[reminder.type as ReminderType] || REMINDER_TYPE_CONFIG.custom;
                const statusConf = statusConfig[reminder.status] || statusConfig.pending;
                const Icon = typeIconMap[reminder.type] || BellRing;
                const isOverdue = reminder.status === 'pending' && new Date(reminder.remindAt) < new Date();
                const isTriggered = reminder.status === 'triggered';

                return (
                  <Card
                    key={reminder.id}
                    className={cn(
                      'transition-all hover:shadow-md',
                      isOverdue && 'border-red-300 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10',
                      isTriggered && !reminder.isRead && 'border-orange-300 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/10',
                    )}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={cn('flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', typeConf.color.replace('text-', 'bg-').replace(/-\d+$/, '-500/10'))}>
                          <Icon className={cn('h-5 w-5', typeConf.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold truncate">{reminder.title}</h3>
                            <Badge variant="outline" className={cn('text-[10px] h-5 shrink-0', statusConf.color)}>
                              {statusConf.label}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-[10px] h-5 shrink-0">
                                逾期
                              </Badge>
                            )}
                          </div>

                          {reminder.message && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{reminder.message}</p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {safeFormat(reminder.remindAt, 'MM-dd HH:mm')}
                            </span>
                            {reminder.entityName && (
                              <span className="flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                {reminder.entityName}
                              </span>
                            )}
                            <span>{REMINDER_TYPE_CONFIG[reminder.type as ReminderType]?.label || reminder.type}</span>
                            <span>{formatDistanceToNow(new Date(reminder.createdAt), { addSuffix: true, locale: zhCN })}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {reminder.entityType && reminder.entityId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="查看关联"
                              onClick={() => navigateToEntity(reminder)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {(isTriggered || isOverdue) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-green-600 hover:text-green-700"
                              onClick={() => handleAction(reminder.id, 'complete')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              完成
                            </Button>
                          )}
                          {(isTriggered || isOverdue) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-muted-foreground"
                              onClick={() => handleAction(reminder.id, 'dismiss')}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              忽略
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(reminder.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <ReminderCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={fetchData}
      />
    </div>
  );
}

// ============ Helpers ============

function mapReminder(r: Record<string, unknown>): CRMReminder {
  return {
    id: r.id as string,
    type: r.type as ReminderType,
    title: r.title as string,
    message: (r.message as string) || null,
    entityType: (r.entity_type as string) || null,
    entityId: (r.entity_id as string) || null,
    entityName: (r.entity_name as string) || null,
    remindAt: r.remind_at as string,
    advanceMinutes: (r.advance_minutes as number) || 60,
    frequency: (r.frequency as string) as CRMReminder['frequency'],
    status: (r.status as string) as ReminderStatus,
    isRead: (r.is_read as boolean) || false,
    triggeredAt: (r.triggered_at as string) || null,
    completedAt: (r.completed_at as string) || null,
    createdBy: (r.created_by as string) || null,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}
