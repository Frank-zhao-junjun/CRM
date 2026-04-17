'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Maximize2,
  Minimize2,
  Download,
  RefreshCw,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Filter,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { useCRM } from '@/lib/crm-context';
import { cn } from '@/lib/utils';

// ============ Types ============
type TimeRange = 'week' | 'month' | 'quarter' | 'year';
type CompareMode = 'none' | 'target' | 'lastPeriod' | 'yoy';

interface OrderItem {
  id: string;
  title: string;
  customer_id: string;
  customer_name: string;
  status: string;
  total: number;
  subtotal: number;
  discount: number;
  items?: Array<Record<string, unknown>>;
  created_at: string;
  updated_at: string;
}

interface KPIData {
  label: string;
  value: number;
  previousValue: number;
  format: 'currency' | 'number' | 'percent';
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}

interface TrendDataPoint {
  period: string;
  actual: number;
  target?: number;
  previous?: number;
}

interface ProductRankItem {
  name: string;
  amount: number;
  count: number;
}

interface CustomerDistItem {
  name: string;
  value: number;
  color: string;
}

interface FunnelStageData {
  stage: string;
  label: string;
  count: number;
  value: number;
  rate: number;
}

// ============ Constants ============
const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  week: '本周',
  month: '本月',
  quarter: '本季度',
  year: '本年',
};

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e',
];

const CHART_COLORS = {
  actual: '#6366f1',
  target: '#22c55e',
  previous: '#94a3b8',
  area: 'rgba(99, 102, 241, 0.1)',
};

// ============ Helper: Format ============
function formatKPIValue(value: number, format: 'currency' | 'number' | 'percent'): string {
  if (format === 'currency') {
    if (value >= 10000) return `¥${(value / 10000).toFixed(1)}万`;
    return `¥${value.toLocaleString()}`;
  }
  if (format === 'percent') return `${value.toFixed(1)}%`;
  return value.toLocaleString();
}

function calcChange(current: number, previous: number): { value: number; isUp: boolean; isNeutral: boolean } {
  if (previous === 0) return { value: current > 0 ? 100 : 0, isUp: current > 0, isNeutral: current === 0 };
  const change = ((current - previous) / previous) * 100;
  return { value: Math.abs(change), isUp: change > 0, isNeutral: change === 0 };
}

// ============ Custom Tooltip ============
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="glass-heavy rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-muted-foreground">{item.name}:</span>
          <span className="font-medium">¥{(item.value ?? 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ============ Main Component ============
export default function AnalyticsDashboard() {
  const { opportunities, customers, leads } = useCRM();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [compareMode, setCompareMode] = useState<CompareMode>('none');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sortBy, setSortBy] = useState<'amount' | 'count'>('amount');
  const [distMode, setDistMode] = useState<'industry' | 'status' | 'level'>('industry');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch orders from API
  useEffect(() => {
    fetch('/api/crm?type=orders')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setOrders(Array.isArray(data.data) ? data.data : []);
      })
      .catch(() => {});
  }, []);

  // ============ Date Range Filter ============
  const getDateRange = useCallback((range: TimeRange) => {
    const now = new Date();
    const start = new Date();
    switch (range) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        start.setMonth(qMonth, 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'year':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    return { start, end: now };
  }, []);

  const filterByDateRange = useCallback(<T extends Record<string, unknown>>(items: T[], dateField: string, range: TimeRange): T[] => {
    const { start, end } = getDateRange(range);
    return items.filter((item) => {
      const d = item[dateField];
      if (!d) return false;
      const date = new Date(d as string);
      return date >= start && date <= end;
    });
  }, [getDateRange]);

  // ============ KPI Calculation ============
  const kpiData: KPIData[] = useMemo(() => {
    const { start } = getDateRange(timeRange);
    const prevStart = new Date(start);
    switch (timeRange) {
      case 'week': prevStart.setDate(prevStart.getDate() - 7); break;
      case 'month': prevStart.setMonth(prevStart.getMonth() - 1); break;
      case 'quarter': prevStart.setMonth(prevStart.getMonth() - 3); break;
      case 'year': prevStart.setFullYear(prevStart.getFullYear() - 1); break;
    }

    const currentOpps = filterByDateRange(opportunities as unknown as Record<string, unknown>[], 'createdAt', timeRange) as unknown as typeof opportunities;
    const prevOpps = opportunities.filter((o) => {
      const d = new Date(o.createdAt || '');
      return d >= prevStart && d < start;
    });

    const currentWon = currentOpps.filter((o) => o.stage === 'closed_won');
    const prevWon = prevOpps.filter((o) => o.stage === 'closed_won');
    const currentRevenue = currentWon.reduce((s, o) => s + (o.value ?? 0), 0);
    const prevRevenue = prevWon.reduce((s, o) => s + (o.value ?? 0), 0);

    const currentOrders = filterByDateRange(orders as unknown as Record<string, unknown>[], 'created_at', timeRange);
    const prevOrders = orders.filter((o) => {
      const d = new Date(o.created_at || '');
      return d >= prevStart && d < start;
    });

    const currentCusts = filterByDateRange(customers as unknown as Record<string, unknown>[], 'createdAt', timeRange) as unknown as typeof customers;
    const prevCusts = customers.filter((c) => {
      const d = new Date(c.createdAt || '');
      return d >= prevStart && d < start;
    });

    const currentOrdersTyped = currentOrders as unknown as OrderItem[];
    const avgOrder = currentOrdersTyped.length > 0 ? currentOrdersTyped.reduce((s, o) => s + (o.total ?? 0), 0) / currentOrdersTyped.length : 0;
    const prevAvgOrder = prevOrders.length > 0 ? prevOrders.reduce((s, o) => s + (o.total ?? 0), 0) / prevOrders.length : 0;

    const targetRevenue = 1000000; // Default target
    const completionRate = targetRevenue > 0 ? (currentRevenue / targetRevenue) * 100 : 0;

    return [
      { label: '本期销售额', value: currentRevenue, previousValue: prevRevenue, format: 'currency' as const, icon: DollarSign, gradient: 'from-violet-500 to-purple-500', iconBg: 'bg-violet-500/10' },
      { label: '成交客户数', value: currentWon.length, previousValue: prevWon.length, format: 'number' as const, icon: Users, gradient: 'from-blue-500 to-cyan-500', iconBg: 'bg-blue-500/10' },
      { label: '平均订单金额', value: avgOrder, previousValue: prevAvgOrder, format: 'currency' as const, icon: ShoppingCart, gradient: 'from-emerald-500 to-green-500', iconBg: 'bg-emerald-500/10' },
      { label: '销售目标完成率', value: completionRate, previousValue: 0, format: 'percent' as const, icon: Target, gradient: 'from-orange-500 to-amber-500', iconBg: 'bg-orange-500/10' },
      { label: '新增客户', value: currentCusts.length, previousValue: prevCusts.length, format: 'number' as const, icon: Users, gradient: 'from-pink-500 to-rose-500', iconBg: 'bg-pink-500/10' },
    ];
  }, [opportunities, customers, orders, timeRange, getDateRange, filterByDateRange]);

  // ============ Trend Data ============
  const trendData: TrendDataPoint[] = useMemo(() => {
    const months = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : timeRange === 'quarter' ? 3 : 12;
    const data: TrendDataPoint[] = [];
    const now = new Date();

    if (timeRange === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = `${d.getMonth() + 1}/${d.getDate()}`;
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        const dayWon = opportunities.filter((o) => {
          const cd = new Date(o.createdAt || '');
          return cd >= dayStart && cd < dayEnd && o.stage === 'closed_won';
        });
        const actual = dayWon.reduce((s, o) => s + (o.value ?? 0), 0);
        data.push({ period: dayStr, actual, target: actual * 1.2 });
      }
    } else if (timeRange === 'month') {
      for (let i = 29; i >= 0; i -= 5) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = `${d.getMonth() + 1}/${d.getDate()}`;
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 5);
        const periodWon = opportunities.filter((o) => {
          const cd = new Date(o.createdAt || '');
          return cd >= dayStart && cd < dayEnd && o.stage === 'closed_won';
        });
        data.push({ period: dayStr, actual: periodWon.reduce((s, o) => s + (o.value ?? 0), 0) });
      }
    } else if (timeRange === 'quarter') {
      for (let i = 2; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${d.getMonth() + 1}月`;
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const mWon = opportunities.filter((o) => {
          const cd = new Date(o.createdAt || '');
          return cd >= mStart && cd < mEnd && o.stage === 'closed_won';
        });
        data.push({ period: label, actual: mWon.reduce((s, o) => s + (o.value ?? 0), 0), target: 300000 });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = `${d.getMonth() + 1}月`;
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const mWon = opportunities.filter((o) => {
          const cd = new Date(o.createdAt || '');
          return cd >= mStart && cd < mEnd && o.stage === 'closed_won';
        });
        data.push({ period: label, actual: mWon.reduce((s, o) => s + (o.value ?? 0), 0), target: 1000000 / 12 });
      }
    }
    return data;
  }, [opportunities, timeRange]);

  // ============ Product Ranking ============
  const productRanking: ProductRankItem[] = useMemo(() => {
    const productMap = new Map<string, { amount: number; count: number }>();
    const currentOrders = filterByDateRange(orders as unknown as Record<string, unknown>[], 'created_at', timeRange);
    currentOrders.forEach((order) => {
      const items = (order as Record<string, unknown>).items as Array<Record<string, unknown>> | undefined;
      if (items) {
        items.forEach((item) => {
          const name = (item.product_name || item.productName || '未知') as string;
          const amount = (item.subtotal || 0) as number;
          const existing = productMap.get(name) || { amount: 0, count: 0 };
          productMap.set(name, { amount: existing.amount + amount, count: existing.count + 1 });
        });
      }
    });
    return Array.from(productMap.entries())
      .map(([name, data]) => ({ name, amount: data.amount, count: data.count }))
      .sort((a, b) => sortBy === 'amount' ? b.amount - a.amount : b.count - a.count)
      .slice(0, 10);
  }, [orders, timeRange, sortBy, filterByDateRange]);

  // ============ Customer Distribution ============
  const customerDist: CustomerDistItem[] = useMemo(() => {
    if (distMode === 'industry') {
      const industryMap = new Map<string, number>();
      customers.forEach((c) => {
        const industry = c.industry || '未分类';
        industryMap.set(industry, (industryMap.get(industry) || 0) + 1);
      });
      return Array.from(industryMap.entries()).map(([name, value], i) => ({
        name, value, color: COLORS[i % COLORS.length],
      }));
    } else if (distMode === 'status') {
      const statusMap: Record<string, number> = { active: 0, inactive: 0, prospect: 0 };
      const statusLabels: Record<string, string> = { active: '活跃', inactive: '非活跃', prospect: '潜在' };
      const statusColors: Record<string, string> = { active: '#22c55e', inactive: '#94a3b8', prospect: '#6366f1' };
      customers.forEach((c) => { statusMap[c.status] = (statusMap[c.status] || 0) + 1; });
      return Object.entries(statusMap)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: statusLabels[k] || k, value: v, color: statusColors[k] || '#94a3b8' }));
    } else {
      // level distribution by opportunity count
      const custOpps = new Map<string, number>();
      opportunities.forEach((o) => {
        custOpps.set(o.customerId, (custOpps.get(o.customerId) || 0) + 1);
      });
      const levels = { VIP: 0, 普通: 0, 潜力: 0 };
      customers.forEach((c) => {
        const oppCount = custOpps.get(c.id) || 0;
        if (oppCount >= 5) levels['VIP']++;
        else if (oppCount >= 2) levels['普通']++;
        else levels['潜力']++;
      });
      const levelColors: Record<string, string> = { VIP: '#f59e0b', '普通': '#6366f1', '潜力': '#94a3b8' };
      return Object.entries(levels).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v, color: levelColors[k] }));
    }
  }, [customers, opportunities, distMode]);

  // ============ Funnel Data ============
  const funnelData: FunnelStageData[] = useMemo(() => {
    const leadItems = leads.map((l) => ({ value: l.estimatedValue ?? 0 }));
    const stages = [
      { stage: 'lead', label: '线索', items: leadItems },
      { stage: 'qualified', label: '商机确认', items: opportunities.filter((o) => o.stage === 'qualified').map((o) => ({ value: o.value ?? 0 })) },
      { stage: 'proposal', label: '方案报价', items: opportunities.filter((o) => o.stage === 'proposal').map((o) => ({ value: o.value ?? 0 })) },
      { stage: 'negotiation', label: '商务洽谈', items: opportunities.filter((o) => o.stage === 'negotiation').map((o) => ({ value: o.value ?? 0 })) },
      { stage: 'closed_won', label: '成交', items: opportunities.filter((o) => o.stage === 'closed_won').map((o) => ({ value: o.value ?? 0 })) },
    ];
    const firstCount = stages[0]?.items.length || 1;
    return stages.map((s) => ({
      stage: s.stage,
      label: s.label,
      count: s.items.length,
      value: s.items.reduce((sum, item) => sum + item.value, 0),
      rate: firstCount > 0 ? (s.items.length / firstCount) * 100 : 0,
    }));
  }, [leads, opportunities]);

  // ============ Handlers ============
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleExport = useCallback(() => {
    const csvContent = [
      ['指标', '本期', '上期'],
      ...kpiData.map((k) => [k.label, k.value.toString(), k.previousValue.toString()]),
    ].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [kpiData, timeRange]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // ============ Render ============
  return (
    <div className="page-section">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title text-xl">销售数据驾驶舱</h1>
          <p className="text-muted-foreground/60 text-sm mt-1 ml-4">
            实时监控核心业务指标，数据驱动决策
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
              <SelectItem value="year">本年</SelectItem>
            </SelectContent>
          </Select>
          <Select value={compareMode} onValueChange={(v) => setCompareMode(v as CompareMode)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无对比</SelectItem>
              <SelectItem value="target">vs 目标</SelectItem>
              <SelectItem value="lastPeriod">vs 上期</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleRefresh}>
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            刷新
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            导出
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 stagger-in">
        {kpiData.map((kpi) => {
          const change = calcChange(kpi.value, kpi.previousValue);
          return (
            <Card key={kpi.label} className="stat-card border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', kpi.iconBg)}>
                    <kpi.icon className="h-4.5 w-4.5" />
                  </div>
                  {kpi.previousValue > 0 && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1.5 py-0 h-5 gap-0.5',
                        change.isUp ? 'text-emerald-600 border-emerald-200 bg-emerald-50/50' :
                        change.isNeutral ? 'text-muted-foreground' :
                        'text-red-600 border-red-200 bg-red-50/50'
                      )}
                    >
                      {change.isUp ? <ArrowUpRight className="h-2.5 w-2.5" /> :
                       change.isNeutral ? <Minus className="h-2.5 w-2.5" /> :
                       <ArrowDownRight className="h-2.5 w-2.5" />}
                      {change.value.toFixed(1)}%
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground/60 font-medium">{kpi.label}</p>
                <p className="text-xl font-bold tracking-tight mt-0.5 counter-animate">
                  {formatKPIValue(kpi.value, kpi.format)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Trend Chart */}
        <Card className="card-elevated border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="section-title text-base">
                业绩趋势
              </CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 rounded bg-[#6366f1]" /> 实际
                </span>
                {compareMode === 'target' && (
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 rounded bg-[#22c55e]" /> 目标
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0/0.06)" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => typeof v === 'number' && v >= 10000 ? `${(v / 10000).toFixed(0)}万` : String(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  {compareMode === 'target' && (
                    <Line type="monotone" dataKey="target" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} name="目标" />
                  )}
                  <Area type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2.5} fill="url(#areaGradient)" dot={{ r: 3, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} name="实际" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sales Funnel */}
        <Card className="card-elevated border-0">
          <CardHeader className="pb-2">
            <CardTitle className="section-title text-base">
              销售漏斗
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {funnelData.map((stage, i) => {
                const maxCount = Math.max(...funnelData.map((s) => s.count), 1);
                const widthPct = (stage.count / maxCount) * 100;
                const stageColors: Record<string, string> = {
                  lead: 'from-slate-400 to-slate-500',
                  qualified: 'from-blue-400 to-blue-500',
                  proposal: 'from-violet-400 to-violet-500',
                  negotiation: 'from-amber-400 to-amber-500',
                  closed_won: 'from-emerald-400 to-emerald-500',
                };
                return (
                  <div key={stage.stage} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{stage.label}</span>
                      <span className="text-muted-foreground/60">
                        {stage.count} 个 · ¥{(stage.value ?? 0).toLocaleString()} · {stage.rate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="relative h-8 bg-muted/30 rounded-lg overflow-hidden">
                      <div
                        className={cn('absolute inset-y-0 left-0 rounded-lg bg-gradient-to-r transition-all duration-700 ease-out', stageColors[stage.stage] || 'from-gray-400 to-gray-500')}
                        style={{ width: `${Math.max(widthPct, 2)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white drop-shadow-sm">{stage.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Product Ranking */}
        <Card className="card-elevated border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="section-title text-base">
                产品销售排行
              </CardTitle>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'amount' | 'count')}>
                <SelectTrigger className="w-[90px] h-7 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amount">按金额</SelectItem>
                  <SelectItem value="count">按数量</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {productRanking.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">暂无产品销售数据</p>
                <p className="text-xs text-muted-foreground/50 mt-1">创建订单后自动统计</p>
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productRanking} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0 0 0/0.06)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : v} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="amount" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} name="金额">
                      {productRanking.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Distribution */}
        <Card className="card-elevated border-0">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="section-title text-base">
                客户分布
              </CardTitle>
              <Select value={distMode} onValueChange={(v) => setDistMode(v as 'industry' | 'status' | 'level')}>
                <SelectTrigger className="w-[100px] h-7 text-[11px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="industry">按行业</SelectItem>
                  <SelectItem value="status">按状态</SelectItem>
                  <SelectItem value="level">按等级</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {customerDist.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[280px] text-center">
                <PieChartIcon className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">暂无客户数据</p>
              </div>
            ) : (
              <div className="flex items-center gap-4 h-[280px]">
                <div className="flex-1 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {customerDist.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value} 个`, name]}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-[120px] space-y-2">
                  {customerDist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground truncate flex-1">{item.name}</span>
                      <span className="text-xs font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Summary */}
      <Card className="card-elevated border-0">
        <CardHeader className="pb-2">
          <CardTitle className="section-title text-base">
            管道概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            {[
              { label: '活跃商机', value: opportunities.filter((o) => !['closed_won', 'closed_lost'].includes(o.stage)).length, sub: `¥${opportunities.filter((o) => !['closed_won', 'closed_lost'].includes(o.stage)).reduce((s, o) => s + (o.value ?? 0), 0).toLocaleString()}`, color: 'text-violet-600' },
              { label: '已成交', value: opportunities.filter((o) => o.stage === 'closed_won').length, sub: `¥${opportunities.filter((o) => o.stage === 'closed_won').reduce((s, o) => s + (o.value ?? 0), 0).toLocaleString()}`, color: 'text-emerald-600' },
              { label: '已丢单', value: opportunities.filter((o) => o.stage === 'closed_lost').length, sub: `¥${opportunities.filter((o) => o.stage === 'closed_lost').reduce((s, o) => s + (o.value ?? 0), 0).toLocaleString()}`, color: 'text-red-500' },
              { label: '活跃线索', value: leads.filter((l) => l.status !== 'disqualified').length, sub: `¥${leads.filter((l) => l.status !== 'disqualified').reduce((s, l) => s + (l.estimatedValue ?? 0), 0).toLocaleString()}`, color: 'text-amber-600' },
            ].map((item) => (
              <div key={item.label} className="text-center p-4 rounded-xl bg-muted/30">
                <p className="text-xs text-muted-foreground/60 font-medium">{item.label}</p>
                <p className={cn('text-2xl font-bold mt-1', item.color)}>{item.value}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
