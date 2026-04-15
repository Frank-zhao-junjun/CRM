'use client';

import { useCRM } from '@/lib/crm-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  GitBranch,
  ArrowRight,
  DollarSign,
  Target,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function ReportsIndexPage() {
  const { opportunities, leads, customers } = useCRM();

  // 计算统计数据
  const activeOpps = opportunities.filter(opp => !['closed_won', 'closed_lost'].includes(opp.stage));
  const wonOpps = opportunities.filter(opp => opp.stage === 'closed_won');
  const totalPipeline = activeOpps.reduce((sum, opp) => sum + opp.value, 0);
  const totalWon = wonOpps.reduce((sum, opp) => sum + opp.value, 0);

  const reportCards = [
    {
      title: '销售漏斗分析',
      description: '可视化展示销售管道各阶段的转化情况',
      href: '/reports/funnel',
      icon: BarChart3,
      gradient: 'from-blue-500 to-cyan-500',
      stats: {
        label: '管道总额',
        value: formatCurrency(totalPipeline),
      },
    },
    {
      title: '团队业绩排行',
      description: '销售团队成员业绩排名，激励良性竞争',
      href: '/reports/team-ranking',
      icon: Trophy,
      gradient: 'from-yellow-500 to-amber-500',
      stats: {
        label: '团队总数',
        value: `${customers.length} 客户`,
      },
    },
    {
      title: '收入预测',
      description: '基于商机阶段概率预测未来收入',
      href: '/reports/forecast',
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      stats: {
        label: '预期收入',
        value: formatCurrency(totalPipeline * 0.5),
      },
    },
    {
      title: '阶段转化分析',
      description: '分析各销售阶段的转化效率，找出业务瓶颈',
      href: '/reports/conversion',
      icon: GitBranch,
      gradient: 'from-purple-500 to-violet-500',
      stats: {
        label: '活跃商机',
        value: `${activeOpps.length} 个`,
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">报表中心</h1>
        <p className="text-muted-foreground mt-1">
          全面的销售数据分析报表，帮助您做出数据驱动的决策
        </p>
      </div>

      {/* 概览统计 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管道总额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPipeline)}</div>
            <p className="text-xs text-muted-foreground">
              {activeOpps.length} 个活跃商机
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已成交</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalWon)}</div>
            <p className="text-xs text-muted-foreground">
              {wonOpps.length} 个成交项目
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">线索数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
            <p className="text-xs text-muted-foreground">
              待转化潜在客户
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">转化率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wonOpps.length + activeOpps.length > 0 
                ? ((wonOpps.length / (wonOpps.length + activeOpps.length)) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              商机成交转化率
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 报表卡片 */}
      <div className="grid gap-4 md:grid-cols-2">
        {reportCards.map((card) => (
          <Link key={card.href} href={card.href} className="group">
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 group-hover:scale-[1.02]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br shadow-lg",
                    card.gradient
                  )}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <CardTitle className="mt-4">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{card.stats.label}</span>
                    <span className="font-medium">{card.stats.value}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 快速提示 */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-violet-600 mt-0.5" />
            <div className="space-y-1 text-sm text-violet-900 dark:text-violet-100">
              <p className="font-medium">使用提示</p>
              <p className="text-violet-700 dark:text-violet-300">
                报表数据支持按时间范围筛选（本月/本季度/本年/全部），并可导出为CSV格式方便进一步分析。
                点击上方任一报表卡片即可进入详细分析页面。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
