'use client';

import { useState } from 'react';
import { useBIDashboardData, type TimeRange } from '@/hooks/useReportData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, BarChart3, Loader2, TrendingUp, Trophy } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function BIReportPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const { bi, loading, error } = useBIDashboardData(timeRange);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BI 仪表盘</h1>
          <p className="text-muted-foreground mt-1">V5.0 数据分析总览：KPI、趋势、漏斗、团队排行</p>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="选择时间范围" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">本月</SelectItem>
            <SelectItem value="quarter">本季度</SelectItem>
            <SelectItem value="year">本年</SelectItem>
            <SelectItem value="all">全部</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6 flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {!loading && !error && bi && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard title="管道总额" value={formatCurrency(bi.kpi.totalPipeline)} sub={`${bi.kpi.activeOpportunities} 个活跃商机`} />
            <MetricCard title="已成交金额" value={formatCurrency(bi.kpi.totalWon)} sub={`${bi.kpi.wonOpportunities} 个成交`} />
            <MetricCard title="赢单率" value={`${bi.kpi.winRate.toFixed(1)}%`} sub={`平均客单 ${formatCurrency(bi.kpi.avgDealSize)}`} />
            <MetricCard title="预测准确度" value={`${bi.kpi.forecastAccuracy.toFixed(1)}%`} sub={`线索 ${bi.kpi.totalLeads} / 客户 ${bi.kpi.totalCustomers}`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> 趋势对比</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bi.trend.map((t) => (
                  <div key={t.period} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{t.period}</span>
                      <span className="text-muted-foreground">{formatCurrency(t.won)} / {formatCurrency(t.pipeline)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-600"
                        style={{ width: `${t.pipeline > 0 ? Math.min((t.won / t.pipeline) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> 漏斗阶段</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bi.funnel.map((f) => (
                  <div key={f.stage} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{f.stageLabel}</p>
                      <p className="text-xs text-muted-foreground">{f.count} 个 · 转化 {f.conversionRate.toFixed(1)}%</p>
                    </div>
                    <Badge variant="outline">{formatCurrency(f.amount)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4" /> 团队 Top 排行</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>团队</TableHead>
                    <TableHead>成交金额</TableHead>
                    <TableHead>赢单数</TableHead>
                    <TableHead>转化率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bi.ranking.map((r) => (
                    <TableRow key={r.memberId}>
                      <TableCell>{r.memberName}</TableCell>
                      <TableCell>{formatCurrency(r.wonAmount)}</TableCell>
                      <TableCell>{r.wonCount}</TableCell>
                      <TableCell>{r.conversionRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
