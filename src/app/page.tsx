'use client';

import { useCRM } from '@/lib/crm-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Contact2, 
  Briefcase, 
  TrendingUp, 
  DollarSign,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const statCards = [
  { key: 'totalCustomers', label: '客户总数', icon: Users, color: 'text-blue-500' },
  { key: 'totalContacts', label: '联系人总数', icon: Contact2, color: 'text-green-500' },
  { key: 'totalOpportunities', label: '销售机会', icon: Briefcase, color: 'text-purple-500' },
  { key: 'totalRevenue', label: '成交总额', icon: DollarSign, color: 'text-orange-500', prefix: '¥' },
];

export default function DashboardPage() {
  const { stats, opportunities, activities } = useCRM();

  // 计算销售漏斗数据
  const funnelData = [
    { stage: '线索', count: opportunities.filter(o => o.stage === 'lead').length, value: opportunities.filter(o => o.stage === 'lead').reduce((sum, o) => sum + o.value, 0) },
    { stage: 'qualified', count: opportunities.filter(o => o.stage === 'qualified').length, value: opportunities.filter(o => o.stage === 'qualified').reduce((sum, o) => sum + o.value, 0) },
    { stage: '提案', count: opportunities.filter(o => o.stage === 'proposal').length, value: opportunities.filter(o => o.stage === 'proposal').reduce((sum, o) => sum + o.value, 0) },
    { stage: '谈判', count: opportunities.filter(o => o.stage === 'negotiation').length, value: opportunities.filter(o => o.stage === 'negotiation').reduce((sum, o) => sum + o.value, 0) },
    { stage: '成交', count: opportunities.filter(o => o.stage === 'closed_won').length, value: opportunities.filter(o => o.stage === 'closed_won').reduce((sum, o) => sum + o.value, 0) },
  ];

  const maxCount = Math.max(...funnelData.map(d => d.count), 1);

  // 最近的机会
  const recentOpportunities = [...opportunities]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const value = stats[stat.key as keyof typeof stats] as number;
          return (
            <Card key={stat.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.prefix || ''}{typeof value === 'number' ? value.toLocaleString() : value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 销售漏斗 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              销售漏斗
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((item, index) => (
                <div key={item.stage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.stage}</span>
                    <span className="font-medium">{item.count} 个</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.max((item.count / maxCount) * 100, item.count > 0 ? 10 : 0)}%`,
                        opacity: 1 - (index * 0.15)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 最近活动 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              最近活动
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">暂无活动记录</p>
              ) : (
                activities.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className={cn(
                      "w-2 h-2 mt-2 rounded-full shrink-0",
                      activity.type === 'created' && 'bg-green-500',
                      activity.type === 'updated' && 'bg-blue-500',
                      activity.type === 'deleted' && 'bg-red-500',
                      activity.type === 'stage_change' && 'bg-purple-500',
                      activity.type.includes('closed') && 'bg-orange-500',
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { 
                          addSuffix: true,
                          locale: zhCN 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近机会 */}
      <Card>
        <CardHeader>
          <CardTitle>最近销售机会</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOpportunities.map((opp) => (
              <div key={opp.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{opp.title}</p>
                  <p className="text-sm text-muted-foreground">{opp.customerName}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium">¥{opp.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(opp.expectedCloseDate), 'MM/dd', { locale: zhCN })} 截止
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
