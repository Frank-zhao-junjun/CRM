'use client';

import { useState, useMemo } from 'react';
import { useCRM } from '@/lib/crm-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Period = 'quarter' | 'half' | 'year';

interface ForecastPoint {
  month: string;
  optimistic: number;
  expected: number;
  conservative: number;
}

export default function ForecastReportPage() {
  const { opportunities } = useCRM();
  const [period, setPeriod] = useState<Period>('quarter');
  
  // 生成模拟预测数据
  const forecastData = useMemo<ForecastPoint[]>(() => {
    const now = new Date();
    const months = period === 'quarter' ? 3 : period === 'half' ? 6 : 12;
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    const pipelineTotal = opportunities
      .filter(opp => !['closed_won', 'closed_lost'].includes(opp.stage))
      .reduce((sum, opp) => sum + opp.value, 0);
    
    return Array.from({ length: months }, (_, i) => {
      const monthIndex = (now.getMonth() + i) % 12;
      const factor = (i + 1) / months;
      return {
        month: monthNames[monthIndex],
        optimistic: Math.round(pipelineTotal * 0.8 * factor),
        expected: Math.round(pipelineTotal * 0.5 * factor),
        conservative: Math.round(pipelineTotal * 0.3 * factor),
      };
    });
  }, [opportunities, period]);
  
  const totals = forecastData.reduce(
    (acc, item) => ({
      optimistic: acc.optimistic + item.optimistic,
      expected: acc.expected + item.expected,
      conservative: acc.conservative + (item.conservative || 0),
    }),
    { optimistic: 0, expected: 0, conservative: 0 }
  );

  const handleExport = () => {
    const headers = ['月份', '乐观预测', '预期预测', '保守预测'];
    const rows = forecastData.map(item => [
      item.month,
      `¥${item.optimistic.toLocaleString()}`,
      `¥${item.expected.toLocaleString()}`,
      `¥${item.conservative.toLocaleString()}`,
    ]);
    rows.push([]);
    rows.push(['总计', `¥${totals.optimistic.toLocaleString()}`, `¥${totals.expected.toLocaleString()}`, `¥${totals.conservative.toLocaleString()}`]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `收入预测报表_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 计算管道统计
  const activeOpps = opportunities.filter(opp => !['closed_won', 'closed_lost'].includes(opp.stage));
  const totalPipeline = activeOpps.reduce((sum, opp) => sum + opp.value, 0);
  const wonOpps = opportunities.filter(opp => opp.stage === 'closed_won');
  const wonAmount = wonOpps.reduce((sum, opp) => sum + opp.value, 0);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">收入预测</h1>
          <p className="text-muted-foreground mt-1">
            基于商机数据和历史转化率预测未来收入
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="选择时间段" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quarter">未来3个月</SelectItem>
              <SelectItem value="half">未来6个月</SelectItem>
              <SelectItem value="year">未来12个月</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
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
            <CardTitle className="text-sm font-medium">预期收入</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totals.expected)}</div>
            <p className="text-xs text-muted-foreground">
              {period === 'quarter' ? '未来3个月' : period === 'half' ? '未来6个月' : '未来12个月'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">乐观预测</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.optimistic)}</div>
            <p className="text-xs text-muted-foreground">
              所有商机都成交
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">保守预测</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totals.conservative)}</div>
            <p className="text-xs text-muted-foreground">
              按概率60%计算
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 收入趋势预测图表 */}
      <Card>
        <CardHeader>
          <CardTitle>收入趋势预测</CardTitle>
          <CardDescription>
            展示未来各月的收入预测区间（乐观-预期-保守）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
                />
                <Tooltip 
                  formatter={(value: number) => [`¥${value.toLocaleString()}`, '']}
                  labelFormatter={(label) => `月份: ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="optimistic" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.3}
                  name="乐观预测"
                />
                <Area 
                  type="monotone" 
                  dataKey="expected" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  name="预期预测"
                />
                <Area 
                  type="monotone" 
                  dataKey="conservative" 
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.3}
                  name="保守预测"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 预测说明 */}
      <Card>
        <CardHeader>
          <CardTitle>预测说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
              <div>
                <h4 className="font-medium text-green-600">乐观预测</h4>
                <p className="text-sm text-muted-foreground">
                  假设所有商机都按100%概率成交，适用于市场行情较好时。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5" />
              <div>
                <h4 className="font-medium text-blue-600">预期预测</h4>
                <p className="text-sm text-muted-foreground">
                  基于各阶段历史转化率计算，考虑商机流失概率。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-amber-500 mt-1.5" />
              <div>
                <h4 className="font-medium text-amber-600">保守预测</h4>
                <p className="text-sm text-muted-foreground">
                  按60%概率计算，适用于市场行情不确定时。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
