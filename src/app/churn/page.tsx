'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useCRM } from '@/lib/crm-context';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';

interface ChurnRisk {
  id: string;
  customerId: string;
  customerName: string;
  churnScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  daysSinceLastContact: number;
  totalRevenue: number;
  lostOpportunities: number;
  riskFactors: string[];
  recommendedActions: string[];
}

const RISK_LEVEL_CONFIG = {
  low: {
    label: '低风险',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: CheckCircle2,
  },
  medium: {
    label: '中风险',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: AlertTriangle,
  },
  high: {
    label: '高风险',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-amber-900/30',
    icon: AlertTriangle,
  },
  critical: {
    label: '危急',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: XCircle,
  },
};

export default function ChurnRiskPage() {
  const { customers, opportunities, activities } = useCRM();
  const [churnData, setChurnData] = useState<ChurnRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'churnScore' | 'lastContact' | 'revenue'>('churnScore');

  const calculateChurnRisk = useCallback(() => {
    const now = new Date();
    const churnRisks: ChurnRisk[] = customers.map((customer) => {
      const customerOpps = opportunities.filter((o) => o.customerId === customer.id);
      const customerActivities = activities.filter(
        (a) => a.entityType === 'customer' && a.entityId === customer.id
      );

      const sortedActivities = [...customerActivities].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const lastActivityTimestamp = sortedActivities[0]?.timestamp || null;

      let daysSinceLastContact = 999;
      if (lastActivityTimestamp) {
        daysSinceLastContact = Math.floor(
          (now.getTime() - new Date(lastActivityTimestamp).getTime()) / (1000 * 60 * 60 * 24)
        );
      } else if (customer.createdAt) {
        daysSinceLastContact = Math.floor(
          (now.getTime() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      let score = 0;
      const riskFactors: string[] = [];
      const recommendedActions: string[] = [];

      if (daysSinceLastContact > 90) {
        score += 40;
        riskFactors.push(`超过90天未联系 (${daysSinceLastContact}天)`);
        recommendedActions.push('立即进行电话回访');
      } else if (daysSinceLastContact > 60) {
        score += 30;
        riskFactors.push(`超过60天未联系 (${daysSinceLastContact}天)`);
        recommendedActions.push('发送关怀邮件');
      } else if (daysSinceLastContact > 30) {
        score += 15;
        riskFactors.push(`超过30天未联系 (${daysSinceLastContact}天)`);
        recommendedActions.push('安排跟进日程');
      }

      const lostOpps = customerOpps.filter((o) => o.stage === 'closed_lost');
      if (lostOpps.length > 0) {
        const recentLost = lostOpps.filter((o) => {
          if (!o.updatedAt) return false;
          const oppDate = new Date(o.updatedAt);
          return (now.getTime() - oppDate.getTime()) / (1000 * 60 * 60 * 24) <= 90;
        });
        if (recentLost.length > 0) {
          score += Math.min(recentLost.length * 15, 30);
          riskFactors.push(`${recentLost.length}个商机最近丢失`);
          recommendedActions.push('分析丢单原因');
        }
      }

      const activeOpps = customerOpps.filter(
        (o) => !['closed_won', 'closed_lost'].includes(o.stage)
      );
      if (activeOpps.length === 0) {
        score += 20;
        riskFactors.push('当前无活跃商机');
        recommendedActions.push('挖掘新商机需求');
      }

      const recentActivities = customerActivities.filter((a) => {
        const activityDate = new Date(a.timestamp);
        return (now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24) <= 30;
      });
      if (recentActivities.length === 0) {
        score += 10;
        riskFactors.push('30天内无任何活动');
      }

      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (score >= 70) riskLevel = 'critical';
      else if (score >= 50) riskLevel = 'high';
      else if (score >= 25) riskLevel = 'medium';
      else riskLevel = 'low';

      const wonOpps = customerOpps.filter((o) => o.stage === 'closed_won');
      const totalRevenue = wonOpps.reduce((sum, o) => sum + o.value, 0);

      return {
        id: `${customer.id}-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        churnScore: score,
        riskLevel,
        daysSinceLastContact,
        totalRevenue,
        lostOpportunities: lostOpps.length,
        riskFactors,
        recommendedActions: recommendedActions.slice(0, 2),
      };
    });

    setChurnData(churnRisks);
    setLoading(false);
  }, [customers, opportunities, activities]);

  useEffect(() => {
    calculateChurnRisk();
  }, [calculateChurnRisk]);

  const lowRiskCount = churnData.filter((c) => c.riskLevel === 'low').length;
  const mediumRiskCount = churnData.filter((c) => c.riskLevel === 'medium').length;
  const highRiskCount = churnData.filter((c) => c.riskLevel === 'high').length;
  const criticalRiskCount = churnData.filter((c) => c.riskLevel === 'critical').length;

  const atRiskCount = highRiskCount + criticalRiskCount;
  const atRiskRevenue = churnData
    .filter((c) => ['high', 'critical'].includes(c.riskLevel))
    .reduce((sum, c) => sum + c.totalRevenue, 0);

  const filteredData = churnData
    .filter((c) => filterRisk === 'all' || c.riskLevel === filterRisk)
    .sort((a, b) => {
      if (sortBy === 'churnScore') return b.churnScore - a.churnScore;
      if (sortBy === 'lastContact') return b.daysSinceLastContact - a.daysSinceLastContact;
      return b.totalRevenue - a.totalRevenue;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">流失预警</h1>
          <p className="text-muted-foreground mt-1">
            识别高流失风险客户，提前采取挽留措施
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterRisk} onValueChange={setFilterRisk}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="critical">危急</SelectItem>
              <SelectItem value="high">高风险</SelectItem>
              <SelectItem value="medium">中风险</SelectItem>
              <SelectItem value="low">低风险</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="churnScore">按风险评分</SelectItem>
              <SelectItem value="lastContact">按未联系天数</SelectItem>
              <SelectItem value="revenue">按收入</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={calculateChurnRisk}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">危急客户</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalRiskCount}</div>
            <p className="text-xs text-muted-foreground">需要立即处理</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">高风险客户</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highRiskCount}</div>
            <p className="text-xs text-muted-foreground">需要重点关注</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">中风险客户</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{mediumRiskCount}</div>
            <p className="text-xs text-muted-foreground">需要保持关注</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">低风险客户</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{lowRiskCount}</div>
            <p className="text-xs text-muted-foreground">状态良好</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>流失风险客户列表</CardTitle>
          <CardDescription>
            共 {atRiskCount} 个客户处于中高风险，涉及收入 {formatCurrency(atRiskRevenue)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>客户名称</TableHead>
                  <TableHead className="text-center">风险评分</TableHead>
                  <TableHead className="text-center">风险等级</TableHead>
                  <TableHead className="text-center">未联系</TableHead>
                  <TableHead className="text-center">客户收入</TableHead>
                  <TableHead>风险因素</TableHead>
                  <TableHead>建议行动</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => {
                  const config = RISK_LEVEL_CONFIG[item.riskLevel];
                  const Icon = config.icon;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Link
                          href={`/customers/${item.customerId}`}
                          className="font-medium hover:underline"
                        >
                          {item.customerName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={item.churnScore} className="h-2 w-16" />
                          <span className={`font-medium ${config.color}`}>{item.churnScore}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={config.bgColor} variant="outline">
                          <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
                          <span className={config.color}>{config.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className={item.daysSinceLastContact > 60 ? 'text-red-600' : 'text-muted-foreground'}>
                            {item.daysSinceLastContact === 999 ? '-' : `${item.daysSinceLastContact}天`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {formatCurrency(item.totalRevenue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.riskFactors.length > 0 ? (
                            item.riskFactors.slice(0, 2).map((factor, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                {factor}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.recommendedActions.length > 0 ? (
                            item.recommendedActions.map((action, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {action}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
