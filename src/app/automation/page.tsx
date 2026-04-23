'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Zap,
  Plus,
  Play,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight,
  Settings,
  Bell,
  Mail,
  Users,
  TrendingUp,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: 'new_lead' | 'stage_change' | 'follow_up_due' | 'deal_won' | 'deal_lost' | 'inactivity' | 'custom';
  triggerLabel: string;
  condition: string;
  actions: string[];
  isEnabled: boolean;
  lastTriggered: string | null;
  triggerCount: number;
}

const TRIGGER_CONFIG: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  new_lead: { label: '新线索', icon: Users, color: 'text-blue-500' },
  stage_change: { label: '阶段变更', icon: TrendingUp, color: 'text-purple-500' },
  follow_up_due: { label: '待跟进', icon: Bell, color: 'text-amber-500' },
  deal_won: { label: '成交', icon: CheckCircle2, color: 'text-green-500' },
  deal_lost: { label: '丢单', icon: AlertTriangle, color: 'text-red-500' },
  inactivity: { label: '长期未跟进', icon: Clock, color: 'text-gray-500' },
  custom: { label: '自定义', icon: Zap, color: 'text-indigo-500' },
};

const SAMPLE_AUTOMATIONS: AutomationRule[] = [
  {
    id: '1',
    name: '新线索自动分配',
    description: '当有新线索创建时，自动分配给空闲的销售人员',
    trigger: 'new_lead',
    triggerLabel: '新线索',
    condition: '线索来源 = 网站',
    actions: ['发送邮件通知', '分配给销售A'],
    isEnabled: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    triggerCount: 156,
  },
  {
    id: '2',
    name: '商机进入方案报价阶段提醒',
    description: '当商机进入方案报价阶段时，通知相关人员准备报价',
    trigger: 'stage_change',
    triggerLabel: '阶段变更',
    condition: '阶段 = 方案报价',
    actions: ['发送邮件通知', '创建待办任务'],
    isEnabled: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    triggerCount: 89,
  },
  {
    id: '3',
    name: '跟进逾期提醒',
    description: '当跟进任务逾期时，自动发送提醒给负责人',
    trigger: 'follow_up_due',
    triggerLabel: '待跟进',
    condition: '逾期超过1天',
    actions: ['发送邮件提醒', '发送短信提醒'],
    isEnabled: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    triggerCount: 234,
  },
  {
    id: '4',
    name: '成交庆祝邮件',
    description: '商机成交后自动发送庆祝邮件给客户',
    trigger: 'deal_won',
    triggerLabel: '成交',
    condition: '阶段 = 成交',
    actions: ['发送庆祝邮件', '通知销售团队'],
    isEnabled: false,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    triggerCount: 67,
  },
  {
    id: '5',
    name: '丢单分析提醒',
    description: '商机丢单后提醒进行原因分析',
    trigger: 'deal_lost',
    triggerLabel: '丢单',
    condition: '阶段 = 丢单',
    actions: ['创建分析任务', '发送邮件通知主管'],
    isEnabled: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    triggerCount: 23,
  },
  {
    id: '6',
    name: '客户长期未跟进预警',
    description: '客户超过60天未跟进时自动预警',
    trigger: 'inactivity',
    triggerLabel: '长期未跟进',
    condition: '未跟进天数 > 60',
    actions: ['创建跟进任务', '发送预警通知'],
    isEnabled: true,
    lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    triggerCount: 145,
  },
];

export default function AutomationPage() {
  const [automations, setAutomations] = useState<AutomationRule[]>(SAMPLE_AUTOMATIONS);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [filterTrigger, setFilterTrigger] = useState<string>('all');

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((auto) =>
        auto.id === id ? { ...auto, isEnabled: !auto.isEnabled } : auto
      )
    );
  };

  const deleteAutomation = (id: string) => {
    setAutomations((prev) => prev.filter((auto) => auto.id !== id));
  };

  const filteredAutomations = automations.filter(
    (auto) => filterTrigger === 'all' || auto.trigger === filterTrigger
  );

  const enabledCount = automations.filter((a) => a.isEnabled).length;
  const totalTriggers = automations.reduce((sum, a) => sum + a.triggerCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">自动化工作流</h1>
          <p className="text-muted-foreground mt-1">
            设置自动化规则，提高销售效率，减少重复工作
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterTrigger} onValueChange={setFilterTrigger}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="筛选类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="new_lead">新线索</SelectItem>
              <SelectItem value="stage_change">阶段变更</SelectItem>
              <SelectItem value="follow_up_due">待跟进</SelectItem>
              <SelectItem value="deal_won">成交</SelectItem>
              <SelectItem value="deal_lost">丢单</SelectItem>
              <SelectItem value="inactivity">长期未跟进</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新建规则
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>创建自动化规则</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">规则名称</Label>
                  <Input id="name" placeholder="输入规则名称" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trigger">触发条件</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="选择触发条件" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_lead">新线索创建</SelectItem>
                      <SelectItem value="stage_change">商机阶段变更</SelectItem>
                      <SelectItem value="follow_up_due">跟进任务到期</SelectItem>
                      <SelectItem value="deal_won">商机成交</SelectItem>
                      <SelectItem value="deal_lost">商机丢单</SelectItem>
                      <SelectItem value="inactivity">客户长期未跟进</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">条件</Label>
                  <Input id="condition" placeholder="输入触发条件" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actions">执行动作</Label>
                  <Textarea id="actions" placeholder="输入要执行的动作，每行一个" rows={3} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>
                    取消
                  </Button>
                  <Button onClick={() => setShowCreate(false)}>
                    创建规则
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已启用规则</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledCount}</div>
            <p className="text-xs text-muted-foreground">
              共 {automations.length} 条规则
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月触发次数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTriggers}</div>
            <p className="text-xs text-muted-foreground">自动化执行统计</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">节省时间</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">~{Math.round(totalTriggers * 0.5)}h</div>
            <p className="text-xs text-muted-foreground">预估每月节省工时</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>自动化规则列表</CardTitle>
          <CardDescription>管理和配置您的自动化工作流规则</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">状态</TableHead>
                <TableHead>规则名称</TableHead>
                <TableHead>触发类型</TableHead>
                <TableHead>触发条件</TableHead>
                <TableHead>执行动作</TableHead>
                <TableHead className="text-center">触发次数</TableHead>
                <TableHead className="text-center">最近触发</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAutomations.map((automation) => {
                const triggerConfig = TRIGGER_CONFIG[automation.trigger];
                const TriggerIcon = triggerConfig?.icon || Zap;
                return (
                  <TableRow key={automation.id} className={cn(!automation.isEnabled && 'opacity-60')}>
                    <TableCell>
                      <Switch
                        checked={automation.isEnabled}
                        onCheckedChange={() => toggleAutomation(automation.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{automation.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {automation.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('gap-1', triggerConfig?.color)}>
                        <TriggerIcon className="h-3 w-3" />
                        {triggerConfig?.label || automation.triggerLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {automation.condition}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {automation.actions.slice(0, 2).map((action, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                        {automation.actions.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{automation.actions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{automation.triggerCount}</span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {automation.lastTriggered
                        ? formatDistanceToNow(new Date(automation.lastTriggered), {
                            addSuffix: true,
                            locale: zhCN,
                          })
                        : '从未触发'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => deleteAutomation(automation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
