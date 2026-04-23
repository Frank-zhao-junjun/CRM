'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Heart,
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

interface CustomerHealth {
  id: string;
  customerId: string;
  customerName: string;
  healthScore: number;
  healthLevel: 'healthy' | 'warning' | 'critical';
  lastActivityTimestamp: string | null;
  openOpportunities: number;
  totalOpportunityValue: number;
  daysSinceLastContact: number;
  riskFactors: string[];
}

const HEALTH_LEVEL_CONFIG = {
  healthy: {
    label: '健康',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: CheckCircle2,
  },
  warning: {
    label: '预警',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    icon: AlertTriangle,
  },
  critical: {
    label: '危险',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: XCircle,
  },
};

export default function CustomerHealthPage() {
  const { customers, opportunities, activities } = useCRM();
  const [healthData, setHealthData] = useState<CustomerHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'healthScore' | 'lastContact'>('healthScore');

  const calculateHealth = useCallback(() => {
    const now = new Date();
    const healthScores: CustomerHealth[] = customers.map((customer) => {
      const customerOpps = opportunities.filter(
        (o) => o.customerId === customer.id && !['closed_won', 'closed_lost'].includes(o.stage)
      );
      const customerActivities = activities.filter(
        (a) => a.entityType === 'customer' && a.entityId === customer.id
      );

      const sortedActivities = [...customerActivities].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const lastActivityTimestamp = sortedActivities[0]?.timestamp || null;

      let daysSinceLastContact = 0;
      if (lastActivityTimestamp) {
        daysSinceLastContact = Math.floor(
          (now.getTime() - new Date(lastActivityTimestamp).getTime()) / (1000 * 60 * 60 * 24)
        );
      } else if (customer.createdAt) {
        daysSinceLastContact = Math.floor(
          (now.getTime() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
      }

      let score = 70;
      const riskFactors: string[] = [];

      if (customerOpps.length > 0) {
        score += Math.min(customerOpps.length * 5, 15);
      }

      if (lastActivityTimestamp) {
        const daysSinceActivity = Math.floor(
          (now.getTime() - new Date(lastActivityTimestamp).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceActivity <= 7) {
          score += 15;
        } else if (daysSinceActivity <= 30) {
          score += 10;
        } else if (daysSinceActivity <= 60) {
          score += 5;
        } else {
          score -= 10;
          riskFactors.push('超过60天无互动');
        }
      } else {
        score -= 20;
        riskFactors.push('无活动记录');
      }

      const totalValue = customerOpps.reduce((sum, o) => sum + o.value, 0);
      if (totalValue > 100000) score += 10;
      else if (totalValue > 50000) score += 5;

      if (daysSinceLastContact > 90) {
        score -= 20;
        riskFactors.push('超过90天未联系');
      }

      score = Math.max(0, Math.min(100, score));

      let healthLevel: 'healthy' | 'warning' | 'critical';
      if (score >= 70) healthLevel = 'healthy';
      else if (score >= 40) healthLevel = 'warning';
      else healthLevel = 'critical';

      return {
        id: `${customer.id}-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        healthScore: score,
        healthLevel,
        lastActivityTimestamp,
        openOpportunities: customerOpps.length,
        totalOpportunityValue: totalValue,
        daysSinceLastContact,
        riskFactors,
      };
    });

    setHealthData(healthScores);
    setLoading(false);
  }, [customers, opportunities, activities]);

  useEffect(() => {
    calculateHealth();
  }, [calculateHealth]);

  const healthyCount = healthData.filter((h) => h.healthLevel === 'healthy').length;
  const warningCount = healthData.filter((h) => h.healthLevel === 'warning').length;
  const criticalCount = healthData.filter((h) => h.healthLevel === 'critical').length;
  const avgHealthScore = healthData.length > 0
    ? Math.round(healthData.reduce((sum, h) => sum + h.healthScore, 0) / healthData.length)
    : 0;

  const filteredData = healthData
    .filter((h) => filterLevel === 'all' || h.healthLevel === filterLevel)
    .sort((a, b) => {
      if (sortBy === 'healthScore') return b.healthScore - a.healthScore;
      return a.daysSinceLastContact - b.daysSinceLastContact;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">客户健康度</h1>
          <p className="text-muted-foreground mt-1">
            监控客户活跃度和健康状况，及时发现流失风险
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="healthy">健康</SelectItem>
              <SelectItem value="warning">预警</SelectItem>
              <SelectItem value="critical">危险</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="healthScore">按健康度</SelectItem>
              <SelectItem value="lastContact">按最近联系</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={calculateHealth}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均健康度</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHealthScore}</div>
            <Progress value={avgHealthScore} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">满分100分</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-600">健康客户</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
            <p className="text-xs text-muted-foreground">
              {customers.length > 0 ? `${((healthyCount / customers.length) * 100).toFixed(1)}%` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">预警客户</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{warningCount}</div>
            <p className="text-xs text-muted-foreground">需要关注</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-600">危险客户</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">立即跟进</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>客户健康度详情</CardTitle>
          <CardDescription>各客户的健康评分和风险因素</CardDescription>
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
                  <TableHead className="text-center">健康评分</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-center">开放商机</TableHead>
                  <TableHead className="text-center">商机金额</TableHead>
                  <TableHead className="text-center">最近联系</TableHead>
                  <TableHead>风险因素</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => {
                  const config = HEALTH_LEVEL_CONFIG[item.healthLevel];
                  const Icon = config.icon;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.customerName}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Progress value={item.healthScore} className="h-2 w-16" />
                          <span className="font-medium">{item.healthScore}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={config.bgColor} variant="outline">
                          <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
                          <span className={config.color}>{config.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{item.openOpportunities}</TableCell>
                      <TableCell className="text-center">
                        {formatCurrency(item.totalOpportunityValue)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{item.daysSinceLastContact}天</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.riskFactors.length > 0 ? (
                            item.riskFactors.map((factor, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                {factor}
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
