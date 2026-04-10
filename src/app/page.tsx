'use client';

import { useState } from 'react';
import { useCRM } from '@/lib/crm-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Contact2, 
  Briefcase, 
  TrendingUp, 
  DollarSign,
  Activity as ActivityIcon,
  ArrowUpRight,
  Sparkles,
  Lightbulb,
  Clock,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SalesFunnel } from '@/components/crm/sales-funnel';
import { QuickFollowUp } from '@/components/crm/quick-follow-up';
import { TodayTodoCard } from '@/components/crm/today-todo';
import type { OpportunityStage } from '@/lib/crm-types';

const statCards = [
  { 
    key: 'totalCustomers', 
    label: '客户总数', 
    icon: Users, 
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/5',
  },
  { 
    key: 'totalContacts', 
    label: '联系人总数', 
    icon: Contact2, 
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'bg-gradient-to-br from-green-500/10 to-emerald-500/5',
  },
  { 
    key: 'totalLeads', 
    label: '销售线索', 
    icon: Lightbulb, 
    gradient: 'from-yellow-500 to-amber-500',
    bgGradient: 'bg-gradient-to-br from-yellow-500/10 to-amber-500/5',
    link: '/leads',
  },
  { 
    key: 'totalOpportunities', 
    label: '销售机会', 
    icon: Briefcase, 
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'bg-gradient-to-br from-purple-500/10 to-pink-500/5',
    link: '/opportunities',
  },
  { 
    key: 'totalRevenue', 
    label: '成交总额', 
    icon: DollarSign, 
    gradient: 'from-orange-500 to-amber-500',
    bgGradient: 'bg-gradient-to-br from-orange-500/10 to-amber-500/5',
    prefix: '¥',
  },
];

const activityColors = {
  created: { bg: 'bg-green-500', label: '新增', color: 'text-green-600 dark:text-green-400' },
  updated: { bg: 'bg-blue-500', label: '更新', color: 'text-blue-600 dark:text-blue-400' },
  deleted: { bg: 'bg-red-500', label: '删除', color: 'text-red-600 dark:text-red-400' },
  stage_change: { bg: 'bg-purple-500', label: '阶段变更', color: 'text-purple-600 dark:text-purple-400' },
  closed_won: { bg: 'bg-emerald-500', label: '成交', color: 'text-emerald-600 dark:text-emerald-400' },
  closed_lost: { bg: 'bg-gray-500', label: '失败', color: 'text-gray-600 dark:text-gray-400' },
  qualified: { bg: 'bg-cyan-500', label: 'Qualified', color: 'text-cyan-600 dark:text-cyan-400' },
  disqualified: { bg: 'bg-yellow-500', label: '放弃', color: 'text-yellow-600 dark:text-yellow-400' },
};

export default function DashboardPage() {
  const { stats, opportunities, activities } = useCRM();
  const [quickFollowUp, setQuickFollowUp] = useState<{ open: boolean; entityType: 'customer' | 'lead' | 'opportunity'; entityId: string; entityName: string }>({
    open: false, entityType: 'opportunity', entityId: '', entityName: '',
  });

  // 计算销售漏斗数据（仅销售机会，不含线索）
  const funnelData: { stage: OpportunityStage; count: number; value: number }[] = [
    { stage: 'qualified', count: opportunities.filter(o => o.stage === 'qualified').length, value: opportunities.filter(o => o.stage === 'qualified').reduce((sum, o) => sum + o.value, 0) },
    { stage: 'proposal', count: opportunities.filter(o => o.stage === 'proposal').length, value: opportunities.filter(o => o.stage === 'proposal').reduce((sum, o) => sum + o.value, 0) },
    { stage: 'negotiation', count: opportunities.filter(o => o.stage === 'negotiation').length, value: opportunities.filter(o => o.stage === 'negotiation').reduce((sum, o) => sum + o.value, 0) },
    { stage: 'closed_won', count: opportunities.filter(o => o.stage === 'closed_won').length, value: opportunities.filter(o => o.stage === 'closed_won').reduce((sum, o) => sum + o.value, 0) },
  ];

  // 最近的机会（不含线索）
  const recentOpportunities = [...opportunities]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // 逾期机会（预计成交日期已过但未成交）
  const now = new Date();
  const overdueOpportunities = opportunities
    .filter(o => 
      o.stage !== 'closed_won' && o.stage !== 'closed_lost' && 
      o.expectedCloseDate && new Date(o.expectedCloseDate) < now
    )
    .map(o => ({
      ...o,
      overdueDays: o.expectedCloseDate 
        ? Math.ceil((now.getTime() - new Date(o.expectedCloseDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 rounded-3xl -z-10" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="gradient-text">欢迎回来</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              这里是你的业务数据总览
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span>实时更新</span>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const value = stats[stat.key as keyof typeof stats] as number;
          return (
            <Card 
              key={stat.key} 
              className={cn(
                "card-hover relative overflow-hidden",
                "animate-in slide-in-from-bottom-4",
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background gradient */}
              <div className={cn("absolute inset-0", stat.bgGradient)} />
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl" />
              
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl",
                  "bg-gradient-to-br shadow-lg",
                  stat.gradient
                )}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold tracking-tight">
                  <span className={cn(
                    "bg-gradient-to-r bg-clip-text text-transparent",
                    stat.gradient
                  )}>
                    {stat.prefix || ''}{typeof value === 'number' ? value.toLocaleString() : value}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span>较上月 +12%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 今日待办 */}
      <TodayTodoCard
        className="animate-in slide-in-from-bottom-4 duration-500"
        onFollowUp={(entityType, entityId, entityName) => setQuickFollowUp({ open: true, entityType, entityId, entityName })}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 销售漏斗 */}
        <Card className="card-hover animate-in slide-in-from-left-4 duration-500">
          <CardHeader className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-purple-500 rounded-full" />
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              销售漏斗
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SalesFunnel data={funnelData} />
          </CardContent>
        </Card>

        {/* 最近活动 */}
        <Card className="card-hover animate-in slide-in-from-right-4 duration-500">
          <CardHeader className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <ActivityIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              最近活动
              <Badge variant="secondary" className="ml-auto">{activities.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">暂无活动记录</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">开始创建客户或销售机会来跟踪活动</p>
                </div>
              ) : (
                activities.slice(0, 6).map((activity, index) => {
                  const colorConfig = activityColors[activity.type as keyof typeof activityColors] || activityColors.updated;
                  return (
                    <div 
                      key={activity.id} 
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl transition-all duration-200",
                        "hover:bg-accent/50 group",
                        "animate-in slide-in-from-left-2",
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={cn(
                        "relative flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                        colorConfig.bg,
                        "shadow-lg shadow-black/10"
                      )}>
                        <div className="w-2 h-2 rounded-full bg-white/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-xs", colorConfig.color)}>
                            {colorConfig.label}
                          </Badge>
                        </div>
                        <p className="font-medium text-sm mt-1 truncate group-hover:text-primary transition-colors">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(activity.timestamp), { 
                            addSuffix: true,
                            locale: zhCN 
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近机会 */}
      <Card className="card-hover animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full" />
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10">
              <Briefcase className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            最近销售机会
            <Badge variant="secondary" className="ml-auto">{opportunities.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentOpportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">暂无销售机会</p>
              <p className="text-xs text-muted-foreground/60 mt-1">创建销售机会开始跟踪你的业务</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {recentOpportunities.map((opp, index) => (
                <div 
                  key={opp.id} 
                  className={cn(
                    "flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                    "hover:border-primary/30 hover:shadow-md hover:bg-accent/30",
                    "group cursor-pointer",
                    "animate-in slide-in-from-bottom-2",
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 group-hover:from-primary/20 group-hover:to-purple-500/20 transition-all">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate group-hover:text-primary transition-colors">
                        {opp.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">{opp.customerName}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {opp.stage === 'closed_won' ? '已成交' : 
                           opp.stage === 'closed_lost' ? '已失败' :
                           opp.stage === 'qualified' ? '已Qualified' :
                           opp.stage === 'proposal' ? '提案' :
                           opp.stage === 'negotiation' ? '谈判' : opp.stage}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuickFollowUp({ open: true, entityType: 'opportunity', entityId: opp.id, entityName: opp.title });
                      }}
                    >
                      <Clock className="h-3 w-3" />
                      跟进
                    </Button>
                    <div className="text-right">
                      <p className="text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                        ¥{opp.value.toLocaleString()}
                      </p>
                      {opp.expectedCloseDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          预计 {format(new Date(opp.expectedCloseDate), 'MM/dd', { locale: zhCN })} 成交
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 逾期提醒 & 数据导出 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 逾期提醒 */}
        <Card className="card-hover animate-in slide-in-from-left-4 duration-500">
          <CardHeader className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-orange-500 rounded-full" />
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/10">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              逾期提醒
              {overdueOpportunities.length > 0 && (
                <Badge variant="destructive" className="ml-2">{overdueOpportunities.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueOpportunities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-emerald-500" />
                </div>
                <p className="text-sm text-muted-foreground">暂无逾期机会</p>
                <p className="text-xs text-muted-foreground/60 mt-1">所有机会都在预计时间内</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueOpportunities.map((opp) => (
                  <div key={opp.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{opp.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{opp.customerName}</span>
                        <Badge variant="outline" className="text-xs">
                          ¥{opp.value.toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-xs font-medium text-red-600 dark:text-red-400">
                        已逾期 {opp.overdueDays} 天
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs mt-1"
                        onClick={() => setQuickFollowUp({ open: true, entityType: 'opportunity', entityId: opp.id, entityName: opp.title })}
                      >
                        立即跟进
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 数据导出 */}
        <Card className="card-hover animate-in slide-in-from-right-4 duration-500">
          <CardHeader className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full" />
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/10 to-blue-500/10">
                <Download className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              数据导出
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                { label: '客户数据', desc: '导出所有客户信息', type: 'customers' },
                { label: '销售线索', desc: '导出所有线索数据', type: 'leads' },
                { label: '销售机会', desc: '导出所有机会数据', type: 'opportunities' },
                { label: '联系人', desc: '导出所有联系人信息', type: 'contacts' },
              ].map((item) => (
                <div key={item.type} className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 hover:bg-accent/30 transition-all cursor-pointer group"
                  onClick={() => {
                    window.open(`/api/export?type=${item.type}`, '_blank');
                  }}
                >
                  <div>
                    <p className="font-medium text-sm group-hover:text-primary transition-colors">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 gap-1">
                    <Download className="h-3 w-3" />
                    CSV
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快捷跟进对话框 */}
      <QuickFollowUp
        open={quickFollowUp.open}
        onOpenChange={(open) => setQuickFollowUp(prev => ({ ...prev, open }))}
        entityType={quickFollowUp.entityType}
        entityId={quickFollowUp.entityId}
        entityName={quickFollowUp.entityName}
      />
    </div>
  );
}
