'use client';

import { useCRM } from '@/lib/crm-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Contact2, 
  Briefcase, 
  TrendingUp, 
  DollarSign,
  Clock,
  Activity,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

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
    key: 'totalOpportunities', 
    label: '销售机会', 
    icon: Briefcase, 
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'bg-gradient-to-br from-purple-500/10 to-pink-500/5',
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
};

export default function DashboardPage() {
  const { stats, opportunities, activities } = useCRM();

  // 计算销售漏斗数据
  const funnelData = [
    { stage: '线索', count: opportunities.filter(o => o.stage === 'lead').length, value: opportunities.filter(o => o.stage === 'lead').reduce((sum, o) => sum + o.value, 0), gradient: 'from-blue-400 to-blue-600' },
    { stage: 'qualified', count: opportunities.filter(o => o.stage === 'qualified').length, value: opportunities.filter(o => o.stage === 'qualified').reduce((sum, o) => sum + o.value, 0), gradient: 'from-cyan-400 to-cyan-600' },
    { stage: '提案', count: opportunities.filter(o => o.stage === 'proposal').length, value: opportunities.filter(o => o.stage === 'proposal').reduce((sum, o) => sum + o.value, 0), gradient: 'from-purple-400 to-purple-600' },
    { stage: '谈判', count: opportunities.filter(o => o.stage === 'negotiation').length, value: opportunities.filter(o => o.stage === 'negotiation').reduce((sum, o) => sum + o.value, 0), gradient: 'from-orange-400 to-orange-600' },
    { stage: '成交', count: opportunities.filter(o => o.stage === 'closed_won').length, value: opportunities.filter(o => o.stage === 'closed_won').reduce((sum, o) => sum + o.value, 0), gradient: 'from-emerald-400 to-emerald-600' },
  ];

  const maxCount = Math.max(...funnelData.map(d => d.count), 1);

  // 最近的机会
  const recentOpportunities = [...opportunities]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

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
            <div className="space-y-5">
              {funnelData.map((item) => (
                <div key={item.stage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm group">
                    <span className="font-medium text-foreground">{item.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{item.count} 个</span>
                      {item.value > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          ¥{item.value.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="h-3 bg-muted/50 rounded-full overflow-hidden p-0.5">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700 ease-out",
                        "bg-gradient-to-r shadow-lg",
                        item.gradient
                      )}
                      style={{ 
                        width: `${Math.max((item.count / maxCount) * 100, item.count > 0 ? 10 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最近活动 */}
        <Card className="card-hover animate-in slide-in-from-right-4 duration-500">
          <CardHeader className="relative">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
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
                           opp.stage === 'lead' ? '线索' :
                           opp.stage === 'qualified' ? '已Qualified' :
                           opp.stage === 'proposal' ? '提案' :
                           opp.stage === 'negotiation' ? '谈判' : opp.stage}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
