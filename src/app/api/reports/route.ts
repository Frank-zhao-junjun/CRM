import { NextRequest, NextResponse } from 'next/server';
import { getMockData } from '@/lib/crm-database';
import type { TimeRange, FunnelReport, TeamRankingReport, ForecastReport, ConversionReport, ReportSummary } from '@/lib/report-types';

// 获取时间范围
function getDateRange(range: TimeRange): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  
  switch (range) {
    case 'this_month':
      return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, end };
    case 'last_month':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { 
        start: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`,
        end: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      };
    case 'this_quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      return { 
        start: `${now.getFullYear()}-${String(quarter * 3 + 1).padStart(2, '0')}-01`, 
        end 
      };
    case 'last_quarter':
      const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
      const lqYear = lastQuarter < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const lqStart = ((lastQuarter + 4) % 4) * 3 + 1;
      return { 
        start: `${lqYear}-${String(lqStart).padStart(2, '0')}-01`,
        end: `${now.getFullYear()}-${String(Math.floor(now.getMonth() / 3) * 3 + 1).padStart(2, '0')}-01`
      };
    case 'this_year':
      return { start: `${now.getFullYear()}-01-01`, end };
    default:
      return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, end };
  }
}

// GET - 获取所有报表汇总数据
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = (searchParams.get('range') || 'this_month') as TimeRange;
  const dateRange = getDateRange(range);
  
  const data = getMockData();
  
  // 筛选时间范围内的数据
  const filteredOpportunities = data.opportunities.filter(op => {
    const createdAt = op.createdAt.split('T')[0];
    return createdAt >= dateRange.start && createdAt <= dateRange.end;
  });
  
  const filteredDeals = data.deals.filter(deal => {
    const signedAt = deal.signedAt?.split('T')[0] || '';
    return signedAt >= dateRange.start && signedAt <= dateRange.end;
  });
  
  // 1. 销售漏斗报表
  const stageOrder = ['qualified', 'discovery', 'proposal', 'negotiation', 'contract', 'closed_won'];
  const stageLabels: Record<string, string> = {
    qualified: '初步接触',
    discovery: '需求调研',
    proposal: '方案报价',
    negotiation: '商务谈判',
    contract: '合同签署',
    closed_won: '成交'
  };
  
  let prevCount = filteredOpportunities.length;
  const funnelStages = stageOrder.map((stage, idx) => {
    const count = filteredOpportunities.filter(op => {
      if (stage === 'closed_won') return op.stage === 'closed_won';
      return op.stage === stage;
    }).length;
    
    const amount = filteredOpportunities
      .filter(op => op.stage === stage)
      .reduce((sum, op) => sum + (op.value || 0), 0);
    
    const conversionRate = prevCount > 0 ? (count / prevCount) * 100 : 0;
    prevCount = count;
    
    return {
      stage,
      label: stageLabels[stage],
      count,
      amount,
      conversionRate: idx === 0 ? 100 : conversionRate
    };
  });
  
  const funnelReport: FunnelReport = {
    stages: funnelStages,
    totalCount: filteredOpportunities.length,
    totalAmount: filteredOpportunities.reduce((sum, op) => sum + (op.value || 0), 0),
    overallConversionRate: filteredOpportunities.length > 0 
      ? (funnelStages[funnelStages.length - 1].count / filteredOpportunities.length) * 100 
      : 0
  };
  
  // 2. 团队排名报表
  const teamMetrics = new Map<string, { closedAmount: number; opportunities: number; won: number; total: number }>();
  
  filteredDeals.forEach(deal => {
    const owner = deal.ownerName || '未分配';
    const current = teamMetrics.get(owner) || { closedAmount: 0, opportunities: 0, won: 0, total: 0 };
    current.closedAmount += deal.amount || 0;
    current.won += 1;
    current.total += 1;
    teamMetrics.set(owner, current);
  });
  
  filteredOpportunities.forEach(op => {
    const owner = op.ownerName || '未分配';
    const current = teamMetrics.get(owner) || { closedAmount: 0, opportunities: 0, won: 0, total: 0 };
    current.opportunities += 1;
    teamMetrics.set(owner, current);
  });
  
  const teamRanking: TeamRankingReport = {
    members: Array.from(teamMetrics.entries())
      .map(([userName, metrics]) => ({
        userId: userName,
        userName,
        closedAmount: metrics.closedAmount,
        newOpportunities: metrics.opportunities,
        conversionRate: metrics.total > 0 ? (metrics.won / metrics.total) * 100 : 0,
        growthRate: Math.random() * 40 - 10, // 模拟环比增长率
        rank: 0
      }))
      .sort((a, b) => b.closedAmount - a.closedAmount)
      .map((member, idx) => ({ ...member, rank: idx + 1 })),
    period: dateRange
  };
  
  // 3. 收入预测报表
  const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
  const forecasts = months.map((month, idx) => {
    const baseValue = filteredDeals.reduce((sum, d) => sum + (d.amount || 0), 0) / 3;
    return {
      month,
      optimistic: baseValue * (1 + Math.random() * 0.5 + 0.75),
      expected: baseValue * (1 + Math.random() * 0.3 + 0.5),
      conservative: baseValue * (1 + Math.random() * 0.2 + 0.25),
      actual: idx < 2 ? baseValue * (1 + Math.random() * 0.3) : undefined
    };
  });
  
  const forecastReport: ForecastReport = {
    forecasts,
    totalOptimistic: forecasts.reduce((sum, f) => sum + f.optimistic, 0),
    totalExpected: forecasts.reduce((sum, f) => sum + f.expected, 0),
    totalConservative: forecasts.reduce((sum, f) => sum + f.conservative, 0),
    totalActual: forecasts.filter(f => f.actual).reduce((sum, f) => sum + (f.actual || 0), 0)
  };
  
  // 4. 阶段转化报表
  const conversionMetrics = funnelStages.map((stage, idx) => {
    const isLast = stage.stage === 'closed_won';
    const avgStayDays = Math.floor(Math.random() * 15 + 5);
    
    return {
      stage: stage.stage,
      label: stage.label,
      enteredCount: idx === 0 ? funnelReport.totalCount : funnelStages[idx - 1].count,
      convertedCount: stage.count,
      conversionRate: stage.conversionRate,
      avgStayDays,
      isBottleneck: stage.conversionRate < 30 && idx > 0 && !isLast
    };
  });
  
  const conversionReport: ConversionReport = {
    metrics: conversionMetrics,
    period: dateRange
  };
  
  // 5. 汇总数据
  const summary: ReportSummary = {
    totalRevenue: filteredDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
    revenueGrowth: Math.random() * 30 - 5,
    totalDeals: filteredDeals.length,
    dealConversion: filteredOpportunities.length > 0 
      ? (filteredDeals.length / filteredOpportunities.length) * 100 
      : 0,
    avgDealValue: filteredDeals.length > 0 
      ? filteredDeals.reduce((sum, d) => sum + (d.amount || 0), 0) / filteredDeals.length 
      : 0,
    pipelineValue: filteredOpportunities
      .filter(op => !['closed_won', 'closed_lost'].includes(op.stage))
      .reduce((sum, op) => sum + (op.value || 0), 0)
  };
  
  return NextResponse.json({
    summary,
    funnel: funnelReport,
    teamRanking,
    forecast: forecastReport,
    conversion: conversionReport
  });
}
